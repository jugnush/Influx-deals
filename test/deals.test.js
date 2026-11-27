import { test } from "node:test";
import assert from "node:assert/strict";
import { bestOf, findItems, percentOff, status, topDeals } from "../src/lib/deals.js";

const today = "2026-11-27";
const tomorrow = "2026-11-28";

test("deal status follows start and end dates", () => {
  assert.equal(status({ start: "2026-12-01" }, today, tomorrow)[0], "Not started");
  assert.equal(status({ end: "2026-11-20" }, today, tomorrow)[0], "Ended");
  assert.equal(status({ end: today }, today, tomorrow)[0], "Ends today");
  assert.equal(status({ end: tomorrow }, today, tomorrow)[0], "Ends tomorrow");
  assert.equal(status({}, today, tomorrow)[0], "On");
});

test("percent off needs a higher regular price", () => {
  assert.equal(percentOff({ price: 50, regular: 100 }), 50);
  assert.equal(percentOff({ price: 50 }), 0);
  assert.equal(percentOff({ price: 50, regular: 40 }), 0);
});

test("best price applies cashback and skips hidden prices", () => {
  const item = { deals: [{ store: "A", price: 100 }, { store: "B", price: 90 }, { store: "Amazon", noPrice: true }] };
  const top = bestOf(item, 0.03);
  assert.equal(top.store, "B");
  assert.equal(top.fin.toFixed(2), "87.30");
});

test("top deals are unique per product and sorted by discount", () => {
  const categories = [{
    id: "x", name: "X",
    items: [
      { name: "One", deals: [{ store: "A", price: 50, regular: 100 }, { store: "B", price: 60, regular: 100 }] },
      { name: "Two", deals: [{ store: "A", price: 80, regular: 100 }] },
      { name: "Three", deals: [{ store: "A", price: 80 }] }
    ]
  }];
  const list = topDeals(categories);
  assert.deepEqual(list.map((d) => d.name), ["One", "Two"]);
  assert.equal(list[0].store, "A");
});

test("search matches every term and sorts by price", () => {
  const pool = [
    { name: "Google Pixel 11 Pro", deals: [{ price: 749 }] },
    { name: "Google Pixel 10", deals: [{ price: 599 }] },
    { name: "LG C6 TV", deals: [{ price: 1399 }] }
  ];
  assert.deepEqual(findItems(pool, "pixel", "price").map((i) => i.name), ["Google Pixel 10", "Google Pixel 11 Pro"]);
  assert.deepEqual(findItems(pool, "pixel pro", "price").map((i) => i.name), ["Google Pixel 11 Pro"]);
});
