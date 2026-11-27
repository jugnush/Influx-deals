import express from "express";
import { fileURLToPath } from "node:url";
import { catalog } from "./providers/catalog.js";
import { bestbuyPrice } from "./providers/bestbuy.js";
import { walmartPrice } from "./providers/walmart.js";

const TTL = 30 * 60 * 1000;
let cache = null;
let pending = null;

const picture = (sku) => sku ? `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${sku.slice(0, 4)}/${sku}_sd.jpg` : undefined;
const swap = (deals, d) => d ? [...deals.filter((x) => x.store !== d.store), d] : deals;

async function refresh() {
  const c = await catalog();
  let live = false;
  for (const cat of c.categories) {
    for (const item of cat.items) {
      try {
        const [bb, wm] = await Promise.all([
          bestbuyPrice(item),
          walmartPrice(item)
        ]);
        if (bb?.at || wm?.at) live = true;
        item.deals = swap(swap(item.deals, bb), wm);
        item.image = bb?.image || wm?.image || picture(item.bestbuySku || item.imageSku) || item.photo;
      } catch (e) {
        item.image ??= picture(item.bestbuySku || item.imageSku) || item.photo;
        console.error(item.name, e.message);
      }
    }
  }
  cache = { categories: c.categories, checked: Date.now(), dataChecked: live ? Date.now() : c.checked };
}

async function getData() {
  if (!cache || Date.now() - cache.checked > TTL) {
    pending ??= refresh().finally(() => { pending = null; });
    if (!cache) await pending
  }
  return cache;
}

const affiliate = { "Walmart": process.env.WALMART_AFFILIATE, "Best Buy": process.env.BESTBUY_AFFILIATE };

function tag(d) {
  const t = affiliate[d.store];
  if (!t || !d.url) return d;
  return { ...d, url: t.includes("{url}") ? t.replace("{url}", encodeURIComponent(d.url)) : t + encodeURIComponent(d.url) };
}

function withLinks(data) {
  if (!affiliate.Walmart && !affiliate["Best Buy"]) return data;
  return {
    ...data,
    categories: data.categories.map((c) => ({ ...c, items: c.items.map((i) => ({ ...i, deals: i.deals.map(tag) })) }))
  };
}

const app = express();
app.disable("x-powered-by");
app.get("/api/deals", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=300");
    res.json(withLinks(await getData()));
  } catch (e) {
    res.status(502).json({ error: "Could not load deals" });
  }
});
const dist = fileURLToPath(new URL("../dist", import.meta.url));
app.use(express.static(dist, { maxAge: "1h" }));
app.get("*", (req, res) => res.sendFile(dist + "/index.html"));
app.listen(process.env.PORT || 3000, () => console.log("up"));
