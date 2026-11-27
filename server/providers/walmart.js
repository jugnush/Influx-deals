import { sameProduct, sanePrice } from "../match.js";
import { serp } from "./serpapi.js";

export const walmart = {
  store: "Walmart",
  mode: "scheduled",
  enabled: () => Boolean(process.env.SERPAPI_KEY),

  async fetch(item, old) {
    const { organic_results: list = [] } = await serp({ engine: "walmart", query: item.walmartQuery || item.name });
    const hit = list.find((r) =>
      !r.sponsored &&
      /^walmart(\.com)?$/i.test(r.seller_name || "") &&
      r.primary_offer?.offer_price &&
      sameProduct(item.name, r.title));
    if (!hit || !sanePrice(hit.primary_offer.offer_price, old)) return null;
    return {
      store: "Walmart",
      price: hit.primary_offer.offer_price,
      url: hit.product_page_url,
      image: hit.thumbnail,
      at: Date.now()
    };
  }
};
