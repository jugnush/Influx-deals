import express from "express";
import { fileURLToPath } from "node:url";
import { catalog } from "./providers/catalog.js";
import { bestbuyPrice } from "./providers/bestbuy.js";
import { walmartPrice } from "./providers/walmart.js";

const TTL = 30 * 60 * 1000
let cache = null;
let pending = null;

const swap = (deals, d) => d ? [...deals.filter((x) => x.store !== d.store), d] : deals;

async function refresh() {
  const c = await catalog();
  for (const cat of c.categories) {
    for (const item of cat.items) {
      try {
        const [bb, wm] = await Promise.all([
          item.bestbuySku ? bestbuyPrice(item.bestbuySku) : null,
          walmartPrice(item)
        ]);
        item.deals = swap(swap(item.deals, bb), wm);
      } catch (e) { console.error(item.name, e.message); }
    }
  }
  cache = { categories: c.categories, checked: Date.now(), dataChecked: c.checked };
}

async function getData() {
  if (!cache || Date.now() - cache.checked > TTL) {
    pending ??= refresh().finally(() => { pending = null; });
    if (!cache) await pending
  }
  return cache;
}

const app = express();
app.disable("x-powered-by");
app.get("/api/deals", async (req, res) => {
  try {
    res.set("Cache-Control", "public, max-age=300");
    res.json(await getData());
  } catch (e) {
    res.status(502).json({ error: "Could not load deals" });
  }
});
const dist = fileURLToPath(new URL("../dist", import.meta.url));
app.use(express.static(dist, { maxAge: "1h" }));
app.get("*", (req, res) => res.sendFile(dist + "/index.html"));
app.listen(process.env.PORT || 3000, () => console.log("up"));
