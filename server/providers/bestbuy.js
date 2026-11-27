const found = new Map();

async function get(query, show) {
  const key = process.env.BESTBUY_KEY;
  const url = `https://api.bestbuy.com/v1/products(${query})?apiKey=${key}&format=json&show=${show}&pageSize=5`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error("Best Buy API " + res.status);
  return (await res.json()).products ?? [];
}

async function findSku(name) {
  if (found.has(name)) return found.get(name);
  const words = name.replace(/["()+,]/g, " ").split(/\s+/).filter((w) => w.length > 1);
  const q = words.map((w) => "search=" + encodeURIComponent(w)).join("&") + "&marketplace=false";
  const [p] = await get(q, "sku");
  const sku = p ? String(p.sku) : null;
  found.set(name, sku);
  return sku;
}

export async function bestbuyPrice(item) {
  if (!process.env.BESTBUY_KEY) return null;
  const sku = item.bestbuySku || await findSku(item.name);
  if (!sku) return null;
  const [p] = await get(`sku=${sku}`, "salePrice,regularPrice,onSale,url,image");
  if (!p) return null;
  const old = item.deals.find((d) => d.store === "Best Buy") || {};
  return {
    ...old,
    store: "Best Buy",
    price: p.salePrice,
    regular: p.onSale ? p.regularPrice : undefined,
    url: old.url || p.url,
    image: p.image,
    at: Date.now()
  };
}
