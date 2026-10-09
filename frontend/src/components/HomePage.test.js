import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { homeContent, homeParts } from "../homeContent.js";

let server;
let HomePage;

before(async () => {
  server = await createServer({
    server: { middlewareMode: true, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
    appType: "custom",
  });
  ({ default: HomePage } = await server.ssrLoadModule("/src/components/HomePage.jsx"));
});

after(async () => { await server?.close(); });

for (const lang of ["en", "hi", "gu"]) {
  test(`homepage renders usable, motion-safe content in ${lang} before hydration`, () => {
    const html = renderToStaticMarkup(React.createElement(HomePage, {
      lang, onIdentify() {}, onExplore() {}, onBreed() {},
    }));
    assert.match(html, /data-motion="reduced"/);
    assert.doesNotMatch(html, /opacity:0|visibility:hidden/);
    assert.equal((html.match(/<h1 /g) || []).length, 1);
    assert.equal((html.match(/<details /g) || []).length, 4);
    assert.equal((html.match(/class="home-breed-button"/g) || []).length, 3);
    assert.ok(html.includes(homeContent[lang].identify));
    assert.ok(html.includes(homeContent[lang].explore));
    assert.ok(html.includes(homeContent[lang].photoLabel));
    assert.match(html, /href="#how-it-works"/);
    assert.match(html, /loading="lazy"/);
    assert.match(html, /fetchPriority="high"/i);
    assert.equal((html.match(/<section /g) || []).length, 4);
    for (const id of homeParts) {
      assert.ok(html.includes(`id="${id}"`));
      assert.ok(html.includes(`href="#${id}"`));
    }
    assert.ok(html.includes(homeContent[lang].nextPhoto));
    assert.ok(html.includes(homeContent[lang].previousPhoto));
    assert.match(html, /data-playing="false"/);
  });
}
