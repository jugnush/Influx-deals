import { keepDates, sameProduct, sanePrice } from "../match.js";
import { serp } from "./serpapi.js";

function why(item, reason, details) {
  if (!process.env.DEBUG_PRICES) return;
  console.log(`  Best Buy | ${item.name} | ${reason}`);
  for (const d of details) console.log(`    - ${d}`);
}

export function bestBuyOffer(stores, sku) {
  const pattern = new RegExp(`(skuId=|/)${sku}(\\.p|&|$|\\?)`);
  return stores.find((s) => /best ?buy/i.test(s.name || "") && pattern.test(s.link || "") && s.extracted_price > 0);
}

export const bestbuySerp = {
  store: "Best Buy",
  mode: "scheduled",
  enabled: () => Boolean(process.env.SERPAPI_KEY) && !process.env.BESTBUY_KEY,

  async fetch(item, old) {
    const sku = item.bestbuySku;
    if (!sku) return null;

    const { shopping_results: list = [] } = await serp({ engine: "google_shopping", q: item.name, gl: "us", hl: "en" });
    const product = list.find((r) => r.immersive_product_page_token && sameProduct(item.name, r.title));
    if (!product) {
      why(item, "no shopping match", list.slice(0, 5).map((r) => `${r.source}: ${r.title}${r.immersive_product_page_token ? "" : " [no token]"}`));
      return null;
    }

    const page = await serp({ engine: "google_immersive_product", page_token: product.immersive_product_page_token, more_stores: "true" });
    const stores = page.product_results?.stores ?? [];
    const offer = bestBuyOffer(stores, sku);
    if (!offer) {
      why(item, `no Best Buy offer for sku ${sku} in "${product.title}"`, stores.map((s) => `${s.name}: ${s.extracted_price} ${s.link?.slice(0, 120)}`));
      return null;
    }
    if (!sanePrice(offer.extracted_price, old)) {
      why(item, `price ${offer.extracted_price} rejected, last known ${old?.price}`, []);
      return null;
    }

    const was = offer.extracted_original_price;
    return {
      ...keepDates(old, offer.extracted_price),
      store: "Best Buy",
      price: offer.extracted_price,
      regular: was > offer.extracted_price ? was : undefined,
      url: old?.url || `https://www.bestbuy.com/site/${sku}.p?skuId=${sku}`,
      at: Date.now()
    };
  }
};
