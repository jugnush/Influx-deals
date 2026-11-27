import { readFile, writeFile } from "node:fs/promises";

const file = new URL("./data/products.json", import.meta.url);
const key = process.env.SERPAPI_KEY;
const skip = new Set(["the", "with", "and", "for", "in", "of", "class", "series", "smart", "tv", "unlocked", "bundle"]);

const variants = new Set(["pro", "plus", "max", "ultra", "mini", "lite", "fe", "xl", "slim", "air", "renewed", "refurbished", "restored"]);

function words(s) {
  return s.toLowerCase().replace(/(\d+)\s*(tb|gb|qt)\b/g, "$1$2").replace(/[^a-z0-9.]+/g, " ").split(" ").filter((w) => w.length > 1 && !skip.has(w));
}

function sameProduct(name, title) {
  const want = words(name);
  const have = new Set(words(title));
  if (want.some((w) => (/\d/.test(w) || variants.has(w)) && !have.has(w))) return false;
  if ([...have].some((w) => variants.has(w) && !want.includes(w))) return false;
  const hits = want.filter((w) => have.has(w)).length;
  return want.length > 0 && hits / want.length >= 0.75;
}

function sane(price, old) {
  return price > 0 && (!old?.price || (price > old.price * 0.3 && price < old.price * 3));
}

async function serp(params) {
  const url = "https://serpapi.com/search.json?" + new URLSearchParams({ ...params, api_key: key });
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || "SerpApi " + res.status);
  return body;
}

async function walmart(item, old) {
  const { organic_results: list = [] } = await serp({ engine: "walmart", query: item.walmartQuery || item.name });
  const hit = list.find((r) => !r.sponsored && /^walmart(\.com)?$/i.test(r.seller_name || "") && r.primary_offer?.offer_price && sameProduct(item.name, r.title));
  if (!hit || !sane(hit.primary_offer.offer_price, old)) return null;
  return {
    store: "Walmart",
    price: hit.primary_offer.offer_price,
    url: hit.product_page_url,
    image: hit.thumbnail,
    at: Date.now()
  };
}

async function bestbuy(item, old) {
  const { shopping_results: list = [] } = await serp({ engine: "google_shopping", q: item.name, gl: "us", hl: "en" });
  const hit = list.find((r) => /best ?buy/i.test(r.source || "") && r.extracted_price && sameProduct(item.name, r.title));
  if (!hit || !sane(hit.extracted_price, old)) return null;
  return {
    store: "Best Buy",
    price: hit.extracted_price,
    regular: hit.extracted_old_price > hit.extracted_price ? hit.extracted_old_price : undefined,
    url: old?.url || hit.product_link,
    at: Date.now()
  };
}

async function main() {
  if (!key) throw new Error("SERPAPI_KEY is not set");
  const data = JSON.parse(await readFile(file, "utf8"));
  const only = process.env.ONLY_STORE;
  let used = 0, changed = 0;

  for (const cat of data.categories) {
    for (const item of cat.items) {
      for (const [store, fetchIt] of [["Walmart", walmart], ...(process.env.SHOPPING_BESTBUY ? [["Best Buy", bestbuy]] : [])]) {
        if (only && only !== store) continue;
        const old = item.deals.find((d) => d.store === store);
        try {
          used++;
          const fresh = await fetchIt(item, old);
          if (!fresh) {
            console.log(`${store} | ${item.name} | no match`);
            continue;
          }
          if (fresh.image && !item.photo) item.photo = fresh.image;
          delete fresh.image;
          item.deals = [...item.deals.filter((d) => d.store !== store), fresh];
          changed++;
          console.log(`${store} | ${item.name} | $${fresh.price}`);
        } catch (e) {
          console.log(`${store} | ${item.name} | ${e.message}`);
        }
      }
    }
  }

  data.checked = new Date().toISOString();
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
  console.log(`searches used: ${used}, prices updated: ${changed}`);
}

main().catch((e) => { console.error(e.message); process.exit(1); });
