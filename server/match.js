const filler = new Set(["the", "with", "and", "for", "in", "of", "class", "series", "smart", "tv", "unlocked", "bundle"]);
const variants = new Set(["pro", "plus", "max", "ultra", "mini", "lite", "fe", "xl", "slim", "air", "renewed", "refurbished", "restored"]);

export function words(text) {
  return text
    .toLowerCase()
    .replace(/(\d+)\s*(tb|gb|qt)\b/g, "$1$2")
    .replace(/[^a-z0-9.]+/g, " ")
    .split(" ")
    .filter((w) => w.length > 1 && !filler.has(w));
}

export function sameProduct(name, title) {
  const want = words(name);
  const have = new Set(words(title));
  if (!want.length) return false;
  if (want.some((w) => (/\d/.test(w) || variants.has(w)) && !have.has(w))) return false;
  if ([...have].some((w) => variants.has(w) && !want.includes(w))) return false;
  return want.filter((w) => have.has(w)).length / want.length >= 0.75;
}

export function sanePrice(price, old) {
  if (!(price > 0)) return false;
  if (!old?.price) return true;
  return price > old.price * 0.3 && price < old.price * 3;
}
