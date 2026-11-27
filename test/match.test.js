import { test } from "node:test";
import assert from "node:assert/strict";
import { sameProduct, sanePrice, words } from "../server/match.js";

test("storage sizes are compared as one token", () => {
  assert.deepEqual(words("WD My Passport 2 TB"), ["wd", "my", "passport", "2tb"]);
  assert.ok(sameProduct("WD My Passport 2 TB", "WD My Passport 2TB Portable External Hard Drive"));
});

test("a different capacity is a different product", () => {
  assert.equal(sameProduct("WD My Passport 2 TB", "WD My Passport 5TB Portable"), false);
  assert.equal(sameProduct("Google Pixel 10 128 GB", "Google Pixel 10 256GB"), false);
});

test("variants must match both ways", () => {
  assert.equal(sameProduct("Google Pixel 11 Pro 256 GB", "Google Pixel 11 - 256GB"), false);
  assert.equal(sameProduct("Google Pixel 10 128 GB", "Google Pixel 10 Pro 128GB"), false);
  assert.ok(sameProduct("Google Pixel 11 Pro 256 GB (Unlocked)", "Google Pixel 11 Pro - 256GB - Obsidian"));
});

test("refurbished listings are rejected", () => {
  assert.equal(sameProduct("Sony WH-1000XM5 headphones", "Restored Sony WH-1000XM5 Headphones (Refurbished)"), false);
});

test("extra marketing words do not block a match", () => {
  assert.ok(sameProduct("LG C6 65\" OLED 4K TV", "LG 65 Inch Class OLED evo C6 4K Smart TV"));
  assert.ok(sameProduct("Sony WH-1000XM5 headphones", "Sony WH-1000XM5 Wireless Noise Canceling Headphones"));
});

test("unrelated titles do not match", () => {
  assert.equal(sameProduct("Nothing Ear (3a) earbuds", "Apple AirPods Pro 3"), false);
  assert.equal(sameProduct("", "anything"), false);
});

test("price sanity bounds", () => {
  assert.ok(sanePrice(1999.99, { price: 1999.99 }));
  assert.ok(sanePrice(49, undefined));
  assert.equal(sanePrice(0, undefined), false);
  assert.equal(sanePrice(299, { price: 1999 }), false);
  assert.equal(sanePrice(7000, { price: 1999 }), false);
});
