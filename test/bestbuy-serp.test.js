import { test } from "node:test";
import assert from "node:assert/strict";
import { bestBuyOffer } from "../server/providers/bestbuy-serp.js";

const stores = [
  { name: "LG Electronics", link: "https://www.lg.com/us/tvs/x", extracted_price: 1299 },
  { name: "Best Buy", link: "https://www.bestbuy.com/site/lg-65-c6/6673112.p?skuId=6673112&utm_source=feed", extracted_price: 1399.99, extracted_original_price: 1999.99 },
  { name: "Best Buy", link: "https://www.bestbuy.com/site/open-box/66731120.p?skuId=66731120", extracted_price: 999 }
];

test("picks the Best Buy offer with the exact SKU", () => {
  const offer = bestBuyOffer(stores, "6673112");
  assert.equal(offer.extracted_price, 1399.99);
});

test("a SKU that only appears as a prefix does not match", () => {
  assert.equal(bestBuyOffer(stores, "667311"), undefined);
});

test("other stores are ignored even with a matching number", () => {
  const onlyOthers = [{ name: "Walmart", link: "https://www.walmart.com/ip/6673112", extracted_price: 10 }];
  assert.equal(bestBuyOffer(onlyOthers, "6673112"), undefined);
});

test("offers without a price are skipped", () => {
  const noPrice = [{ name: "Best Buy", link: "https://www.bestbuy.com/site/6673112.p?skuId=6673112" }];
  assert.equal(bestBuyOffer(noPrice, "6673112"), undefined);
});
