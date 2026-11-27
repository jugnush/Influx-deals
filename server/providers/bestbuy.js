import { keepDates, sanePrice } from "../match.js";

const skus = new Map();

async function query(filter, show) {
  const url = `https://api.bestbuy.com/v1/products(${filter})?apiKey=${process.env.BESTBUY_KEY}&format=json&show=${show}&pageSize=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error("Best Buy API " + res.status);
  return (await res.json()).products ?? [];
}

async function findSku(name) {
  if (skus.has(name)) return skus.get(name);
  const terms = name.replace(/["()+,]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const [p] = await query(terms.map((w) => "search=" + encodeURIComponent(w)).join("&") + "&marketplace=false", "sku");
  const sku = p ? String(p.sku) : null;
  skus.set(name, sku);
  return sku;
}

export const bestbuy = {
  store: "Best Buy",
  mode: "live",
  enabled: () => Boolean(process.env.BESTBUY_KEY),

  async fetch(item, old) {
    const sku = item.bestbuySku || await findSku(item.name);
    if (!sku) return null;
    const [p] = await query(`sku=${sku}`, "salePrice,regularPrice,onSale,url,image");
    if (!p || !sanePrice(p.salePrice, old)) return null;
    return {
      ...keepDates(old, p.salePrice),
      store: "Best Buy",
      price: p.salePrice,
      regular: p.onSale ? p.regularPrice : undefined,
      url: old?.url || p.url,
      image: p.image,
      at: Date.now()
    };
  }
};
