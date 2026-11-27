import { sameProduct, sanePrice } from "../match.js";

async function serp(params) {
  const url = "https://serpapi.com/search.json?" + new URLSearchParams({ ...params, api_key: process.env.SERPAPI_KEY });
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || "SerpApi " + res.status);
  return body;
}

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
