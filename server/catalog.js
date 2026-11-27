import { readFile } from "node:fs/promises";
const file = new URL("./data/products.json", import.meta.url);
export async function catalog() {
  const d = JSON.parse(await readFile(file, "utf8"));
  return { categories: d.categories, checked: Date.parse(d.checked) };
}
