import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { homeContent, featuredBreeds, homeParts } from "./homeContent.js";
import { breedGallery, SLIDE_INTERVAL_MS } from "./breedGallery.js";

function shape(value) {
  if (Array.isArray(value)) return value.map(shape);
  if (typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, shape(child)]));
  assert.equal(typeof value, "string");
  assert.ok(value.trim().length > 0);
  return "string";
}

test("all homepage and shared navigation content has English, Hindi and Gujarati parity", () => {
  assert.deepEqual(Object.keys(homeContent), ["en", "hi", "gu"]);
  const englishShape = shape(homeContent.en);
  for (const lang of ["hi", "gu"]) {
    assert.deepEqual(shape(homeContent[lang]), englishShape);
    assert.notEqual(homeContent[lang].title, homeContent.en.title);
    assert.equal(homeContent[lang].steps.length, 3);
    assert.equal(homeContent[lang].faqs.length, 4);
  }
});

test("featured cards link to supported breeds and existing local photographs", () => {
  const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  assert.equal(featuredBreeds.length, 3);
  for (const breed of [...featuredBreeds, { id: "Nari", image: "/breeds/Nari.jpg" }]) {
    assert.ok(app.includes(`"${breed.id}": {`), `${breed.id} has a real catalog detail`);
    assert.ok(existsSync(new URL(`../public${breed.image}`, import.meta.url)), breed.image);
  }
  for (const lang of Object.values(homeContent)) {
    for (const breed of featuredBreeds) {
      assert.ok(lang.breedNames[breed.id]);
      assert.ok(lang.breedRegions[breed.id]);
      assert.ok(lang.breedNotes[breed.id]);
    }
  }
});

test("homepage explains model limits, public history and cold starts instead of promising outcomes", () => {
  const answers = homeContent.en.faqs.map(({ answer }) => answer).join(" ");
  assert.match(answers, /not a guarantee/);
  assert.match(answers, /cannot verify genetics or diagnose health/);
  assert.match(answers, /breed-reference information, not measurements/);
  assert.match(answers, /shared, public prediction history/);
  assert.match(answers, /free API can sleep/);
  assert.doesNotMatch(JSON.stringify(homeContent.en), /50 indigenous|instant results|health markers|99%|85%/i);
});

test("hero slideshow covers all 50 local catalog images exactly once at two-second intervals", () => {
  const app = readFileSync(new URL("./App.jsx", import.meta.url), "utf8");
  const files = readdirSync(new URL("../public/breeds", import.meta.url)).sort();
  assert.equal(SLIDE_INTERVAL_MS, 2000);
  assert.equal(breedGallery.length, 50);
  assert.equal(new Set(breedGallery.map(({ id }) => id)).size, 50);
  assert.deepEqual(breedGallery.map(({ image }) => image.replace("/breeds/", "")).sort(), files);
  for (const breed of breedGallery) {
    assert.ok(app.includes(`"${breed.id}": {`), `${breed.id} has a catalog destination`);
    for (const lang of ["en", "hi", "gu"]) assert.ok(breed.names[lang]);
  }
});

test("four scroll cards have stable IDs and translated gallery controls", () => {
  assert.equal(homeParts.length, 4);
  assert.equal(new Set(homeParts).size, 4);
  for (const copy of Object.values(homeContent)) {
    for (const key of ["previousPhoto", "nextPhoto", "playSlideshow", "pauseSlideshow", "reducedSlideshow"]) assert.ok(copy[key]);
  }
});
