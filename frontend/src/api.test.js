import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import { getHistory, predictCow } from "./api.js";

afterEach(() => mock.restoreAll());

test("prediction uploads the original multipart field and returns the result", async () => {
  mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "http://localhost:8000/predict");
    assert.equal(options.method, "POST");
    assert.ok(options.body.get("file") instanceof Blob);
    return Response.json({ breed: "Gir", confidence: 90 });
  });
  assert.equal((await predictCow(new Blob(["image"]))).breed, "Gir");
});

test("HTTP errors surface the backend detail", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({ detail: "Model is unavailable." }, { status: 503 }));
  await assert.rejects(predictCow(new Blob(["image"])), /Model is unavailable/);
});

test("legacy prediction errors remain visible", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({ error: "Prediction failed" }));
  await assert.rejects(predictCow(new Blob(["image"])), /Prediction failed/);
});

test("network and HTML errors are not turned into empty history", async () => {
  mock.method(globalThis, "fetch", async () => { throw new TypeError("Failed to fetch"); });
  await assert.rejects(getHistory(), /Failed to fetch/);
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () => new Response("<html>Unavailable</html>", { status: 502 }));
  await assert.rejects(getHistory(), /invalid response \(HTTP 502\)/);
});

test("history requires an array", async () => {
  mock.method(globalThis, "fetch", async () => Response.json({}));
  await assert.rejects(getHistory(), /invalid history data/);
  mock.restoreAll();
  mock.method(globalThis, "fetch", async () => Response.json([{ breed: "Gir" }]));
  assert.deepEqual(await getHistory(), [{ breed: "Gir" }]);
});

test("null JSON is an explicit error", async () => {
  mock.method(globalThis, "fetch", async () => Response.json(null));
  await assert.rejects(getHistory(), /invalid response/);
});
