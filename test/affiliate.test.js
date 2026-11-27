import { test } from "node:test";
import assert from "node:assert/strict";
import { affiliateLinks } from "../server/affiliate.js";

const data = {
  categories: [{
    id: "tvs",
    items: [{
      name: "TV",
      deals: [
        { store: "Walmart", price: 100, url: "https://www.walmart.com/ip/1" },
        { store: "Best Buy", price: 110, url: "https://www.bestbuy.com/site/2.p" },
        { store: "Amazon", noPrice: true }
      ]
    }]
  }]
};

test("links stay untouched without templates", () => {
  assert.equal(affiliateLinks({})(data), data);
});

test("the {url} placeholder receives the encoded store link", () => {
  const out = affiliateLinks({ WALMART_AFFILIATE: "https://goto.walmart.com/c/1/2/3?u={url}" })(data);
  const [wm, bb, amz] = out.categories[0].items[0].deals;
  assert.equal(wm.url, "https://goto.walmart.com/c/1/2/3?u=" + encodeURIComponent("https://www.walmart.com/ip/1"));
  assert.equal(bb.url, "https://www.bestbuy.com/site/2.p");
  assert.equal(amz.url, undefined);
});

test("templates without a placeholder get the link appended", () => {
  const out = affiliateLinks({ BESTBUY_AFFILIATE: "https://track.example/?u=" })(data);
  assert.equal(out.categories[0].items[0].deals[1].url, "https://track.example/?u=" + encodeURIComponent("https://www.bestbuy.com/site/2.p"));
});

test("the source data is not modified", () => {
  affiliateLinks({ WALMART_AFFILIATE: "x{url}" })(data);
  assert.equal(data.categories[0].items[0].deals[0].url, "https://www.walmart.com/ip/1");
});
