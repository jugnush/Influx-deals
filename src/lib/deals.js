export const CARDS = [
  ["Bank of America 3%", 3],
  ["Apple Card + Apple Pay 2%", 2],
  ["Citi / Wells Fargo 2%", 2],
  ["Capital One / Chase Freedom 1.5%", 1.5],
  ["No card cashback", 0]
];

const day = (ms = 0) => new Date(Date.now() + ms).toISOString().slice(0, 10);

export const money = (n) => "$" + n.toFixed(2);

export const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const shortDate = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export function ago(t, now) {
  const m = Math.max(0, Math.floor((now - t) / 60000));
  if (m < 1) return "just now";
  return m < 60 ? m + " min ago" : Math.floor(m / 60) + " h ago";
}

export const percentOff = (d) => d.regular > d.price ? Math.round((1 - d.price / d.regular) * 100) : 0;

export function status(d, today = day(), tomorrow = day(864e5)) {
  if (d.start && today < d.start) return ["Not started", "off"];
  if (d.end && today > d.end) return ["Ended", "off"];
  if (d.end === today) return ["Ends today", "warn"];
  if (d.end === tomorrow) return ["Ends tomorrow", "warn"];
  return [d.end ? `On until ${d.end}` : "On", "on"];
}

const running = (d) => d.price > 0 && status(d)[1] !== "off";

export function bestOf(item, pct) {
  return item.deals
    .filter(running)
    .map((d) => ({ ...d, fin: d.price * (1 - pct) }))
    .sort((a, b) => a.fin - b.fin)[0];
}

export function topDeals(categories, count = 4) {
  return categories
    .flatMap((c) => c.items.flatMap((i) => i.deals
      .filter((d) => running(d) && d.regular > d.price)
      .map((d) => ({ ...d, cat: c, name: i.name, image: i.image, off: percentOff(d) }))))
    .sort((a, b) => b.off - a.off || (b.regular - b.price) - (a.regular - a.price))
    .filter((d, n, all) => all.findIndex((x) => x.name === d.name) === n)
    .slice(0, count);
}

export function findItems(pool, query, sort) {
  const live = (i) => i.deals.filter(running);
  const low = (i) => Math.min(...live(i).map((d) => d.price), Infinity);
  const off = (i) => Math.max(0, ...live(i).map(percentOff));
  const ends = (i) => live(i).map((d) => d.end).filter(Boolean).sort()[0] || "9999";
  const order = {
    price: (a, b) => low(a) - low(b),
    off: (a, b) => off(b) - off(a) || low(a) - low(b),
    ends: (a, b) => ends(a).localeCompare(ends(b)) || low(a) - low(b)
  };
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return pool.filter((i) => terms.every((t) => i.name.toLowerCase().includes(t))).sort(order[sort] ?? order.price);
}
