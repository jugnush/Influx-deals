export async function bestbuyPrice(sku) {
  const key = process.env.BESTBUY_KEY;
  if (!key) return null;
  const url = `https://api.bestbuy.com/v1/products(sku=${sku})?apiKey=${key}&format=json&show=salePrice,regularPrice,startDate,url`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error("Best Buy API " + res.status);
  const p = (await res.json()).products?.[0];
  return p ? { store: "Best Buy", price: p.salePrice, regular: p.regularPrice,
    start: (p.startDate || "").slice(0, 10), url: p.url } : null;
}
