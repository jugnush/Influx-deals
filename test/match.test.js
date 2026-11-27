import { test } from "node:test";
import assert from "node:assert/strict";
import { keepDates, sameProduct, sanePrice, words } from "../server/match.js";

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

test("deal dates are kept only while the price stays the same", () => {
  const old = { store: "Best Buy", price: 299.99, start: "2026-11-19", end: "2026-11-28", url: "u" };
  assert.deepEqual(keepDates(old, 299.99), old);
  assert.deepEqual(keepDates(old, 169.99), { store: "Best Buy", price: 299.99, url: "u" });
  assert.deepEqual(keepDates(undefined, 10), {});
});

test("packages, combos and recertified listings are rejected", () => {
  assert.equal(sameProduct("Samsung Galaxy S26+ 256 GB (Unlocked)", "Recertified - Samsung Galaxy S26+ Unlocked 256GB Cobalt Violet (Grade B)"), false);
  assert.equal(sameProduct("TCL 98\" QM7L QD-Mini LED 4K", "Package - TCL - 98\" Class QM7L Series 4K UHD HDR SQD-Mini LED Smart TV and Q85H Sound Bar"), false);
  assert.equal(sameProduct("LG C6 65\" OLED 4K TV", "LG 65\" Class C6 Series 4K OLED evo AI Smart TV with 5.1.3 Channel Soundbar System"), false);
});
