import { readFile, writeFile } from "node:fs/promises";
import { active } from "./providers/index.js";

const file = new URL("./data/products.json", import.meta.url);

async function main() {
  const only = process.env.ONLY_STORE;
  const jobs = active("scheduled").filter((p) => !only || p.store === only);
  if (!jobs.length) throw new Error("No scheduled provider is configured (set SERPAPI_KEY)");

  const data = JSON.parse(await readFile(file, "utf8"));
  let calls = 0, updated = 0, failed = 0;

  for (const cat of data.categories) {
    for (const item of cat.items) {
      for (const p of jobs) {
        const old = item.deals.find((d) => d.store === p.store);
        calls++;
        try {
          const deal = await p.fetch(item, old);
          if (!deal) {
            console.log(`${p.store} | ${item.name} | no match`);
            continue;
          }
          if (deal.image && !item.photo) item.photo = deal.image;
          delete deal.image;
          item.deals = [...item.deals.filter((d) => d.store !== p.store), deal];
          updated++;
          console.log(`${p.store} | ${item.name} | $${deal.price}`);
        } catch (e) {
          failed++;
          console.log(`${p.store} | ${item.name} | error: ${e.message}`);
        }
      }
    }
  }

  console.log(`calls: ${calls}, updated: ${updated}, failed: ${failed}`);
  if (failed > calls / 2) throw new Error("More than half of the price lookups failed");

  data.checked = new Date().toISOString();
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
