import { sameProduct, sanePrice } from "../match.js";
import { serp } from "./serpapi.js";

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
    if (!product) return null;

    const page = await serp({ engine: "google_immersive_product", page_token: product.immersive_product_page_token, more_stores: "true" });
    const offer = bestBuyOffer(page.product_results?.stores ?? [], sku);
    if (!offer || !sanePrice(offer.extracted_price, old)) return null;

    const was = offer.extracted_original_price;
    return {
      ...old,
      store: "Best Buy",
      price: offer.extracted_price,
      regular: was > offer.extracted_price ? was : undefined,
      url: old?.url || `https://www.bestbuy.com/site/${sku}.p?skuId=${sku}`,
      at: Date.now()
    };
  }
};
