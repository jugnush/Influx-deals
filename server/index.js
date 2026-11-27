import express from "express";
import { fileURLToPath } from "node:url";
import { catalog } from "./catalog.js";
import { active } from "./providers/index.js";
import { affiliateLinks } from "./affiliate.js";

const TTL = 30 * 60 * 1000;
let cache = null;
let pending = null;

const picture = (sku) => sku ? `https://pisces.bbystatic.com/image2/BestBuy_US/images/products/${sku.slice(0, 4)}/${sku}_sd.jpg` : undefined;

async function refresh() {
  const data = await catalog();
  const live = active("live");
  let fresh = false;

  for (const cat of data.categories) {
    for (const item of cat.items) {
      let image;
      for (const p of live) {
        const old = item.deals.find((d) => d.store === p.store);
        try {
          const deal = await p.fetch(item, old);
          if (!deal) continue;
          image ??= deal.image;
          item.deals = [...item.deals.filter((d) => d.store !== p.store), deal];
          fresh = true;
        } catch (e) {
          console.error(`${p.store} | ${item.name} | ${e.message}`);
        }
      }
      item.image = image || picture(item.bestbuySku || item.imageSku) || item.photo;
    }
  }

  cache = { categories: data.categories, checked: Date.now(), dataChecked: fresh ? Date.now() : data.checked };
}

async function getData() {
  if (!cache || Date.now() - cache.checked > TTL) {
    pending ??= refresh().finally(() => { pending = null; });
    if (!cache) await pending;
  }
  return cache;
}

const withLinks = affiliateLinks();
const app = express();
app.disable("x-powered-by");

app.get("/healthz", (req, res) => {
  res.json({ ok: true, cachedAt: cache?.checked ?? null, live: active("live").map((p) => p.store) });
});

app.get("/api/deals", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=300");
    res.json(withLinks(await getData()));
  } catch (e) {
    console.error("deals |", e.message);
    res.status(502).json({ error: "Could not load deals" });
  }
});

const dist = fileURLToPath(new URL("../dist", import.meta.url));
app.use(express.static(dist, { maxAge: "1h" }));
app.get("*", (req, res) => res.sendFile(dist + "/index.html"));
app.listen(process.env.PORT || 3000, () => console.log("up"));
