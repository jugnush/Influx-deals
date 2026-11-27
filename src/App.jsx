import { useEffect, useMemo, useState } from "react";

const CARDS = [
  ["Bank of America 3%", 3], ["Apple Card + Apple Pay 2%", 2], ["Citi / Wells Fargo 2%", 2],
  ["Capital One / Chase Freedom 1.5%", 1.5], ["No card cashback", 0]
];
const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => "$" + n.toFixed(2);
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);
const ago = (t, now) => {
  const m = Math.max(0, Math.floor((now - t) / 60000));
  return m < 1 ? "just now" : m < 60 ? m + " min ago" : Math.floor(m / 60) + " h ago";
};
const shortDate = (t) => new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const slug = (n) => n.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const go = (path) => { history.pushState(null, "", path); dispatchEvent(new PopStateEvent("popstate")); scrollTo(0, 0); };
const offOf = (d) => d.regular > d.price ? Math.round((1 - d.price / d.regular) * 100) : 0;
function status(d) {
  const t = today();
  if (d.start && t < d.start) return ["Not started", "off"];
  if (d.end && t > d.end) return ["Ended", "off"];
  if (d.end === t) return ["Ends today", "warn"];
  if (d.end === tomorrow()) return ["Ends tomorrow", "warn"];
  return [d.end ? `On until ${d.end}` : "On", "on"];
}
function BestDeals({ cats, pct, pick }) {
  const list = cats.flatMap((c) => c.items.flatMap((i) => i.deals
    .filter((d) => d.price > 0 && d.regular > d.price && status(d)[1] !== "off")
    .map((d) => ({ ...d, cat: c, name: i.name, image: i.image, off: Math.round((1 - d.price / d.regular) * 100) }))))
    .sort((a, b) => b.off - a.off || (b.regular - b.price) - (a.regular - a.price))
    .filter((d, n, all) => all.findIndex((x) => x.name === d.name) === n)
    .slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="top">
      <h2>Best deals right now</h2>
      <div className="topgrid">
        {list.map((d) => (
          <button key={d.name} className="topcard" onClick={() => go("/p/" + slug(d.name))}>
            {d.image && <img src={d.image} alt="" loading="lazy" />}
            <span className="off">{d.off}% off</span>
            <span className="tname">{d.name}</span>
            <span className="tprice">{money(d.price * (1 - pct))}</span>
            <span className="fin">{d.store} · was {money(d.regular)} · save {money(d.regular - d.price)}</span>
            <span className={"fin" + (status(d)[1] === "warn" ? " hurry" : "")}>{d.end ? status(d)[0].replace("On until", "Ends") : "No end date listed"} · {d.cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
function Ad({ id }) { return <div className="ad" id={id}>Ad space</div>; }

function Source({ d, now, checked }) {
  const text = d.at ? `Live · ${ago(d.at, now)}` : `Checked ${shortDate(checked)}`;
  const cls = "src" + (d.at ? " live" : "");
  return d.url ? <a className={cls} href={d.url} rel="sponsored noopener" target="_blank">{text}</a> : <span className={cls}>{text}</span>;
}

function Photo({ item, big }) {
  return item.image
    ? <img className={big ? "hero-pic" : "pic"} src={item.image} alt={item.name} loading={big ? "eager" : "lazy"} />
    : <div className={(big ? "hero-pic" : "pic") + " nopic"}>No photo yet</div>;
}

function Stores({ item, pct, now, checked }) {
  const priced = item.deals.filter((d) => d.price > 0).map((d) => ({ ...d, fin: d.price * (1 - pct) })).sort((a, b) => a.fin - b.fin);
  const blank = item.deals.filter((d) => d.noPrice);
  return (
    <ul className="stores">
      {priced.map((d) => {
        const [label, tone] = status(d);
        return <li key={d.store}><span>{d.store}</span><b>{money(d.fin)}</b><span className={"pill " + tone}>{label}</span>
          <Source d={d} now={now} checked={checked} /></li>;
      })}
      {blank.map((d) => <li key={d.store}><span>{d.store}</span><span className="mute">Price not shown here</span>
        {d.url && <a href={d.url} rel="sponsored noopener">View</a>}</li>)}
    </ul>
  );
}

function bestOf(item, pct) {
  return item.deals.filter((d) => d.price > 0 && status(d)[1] !== "off").map((d) => ({ ...d, fin: d.price * (1 - pct) })).sort((a, b) => a.fin - b.fin)[0];
}

function PriceBox({ top }) {
  if (!top) return <div className="nop">No price shown here yet.</div>;
  const off = offOf(top);
  return (<>
    {off > 0 && <span className="off">{off}% off</span>}
    <div className="price">{money(top.fin)}</div>
    <div className="fin">at {top.store} · list {money(top.price)}{off > 0 ? ` · was ${money(top.regular)}` : ""}</div>
  </>);
}

function Product({ item, pct, best, now, checked }) {
  const top = bestOf(item, pct);
  const open = (e) => { e.preventDefault(); go("/p/" + slug(item.name)); };
  return (
    <article className={"card" + (best ? " best" : "")}>
      {best && <span className="badge">Lowest</span>}
      <a className="row" href={"/p/" + slug(item.name)} onClick={open}>
        <Photo item={item} />
        <div className="side">
          <h2 className="drive">{item.name}</h2>
          <PriceBox top={top} />
        </div>
      </a>
      <Stores item={item} pct={pct} now={now} checked={checked} />
    </article>
  );
}

function Detail({ item, cat, pct, now, checked }) {
  const top = bestOf(item, pct);
  return (
    <article className="detail">
      <button className="back" onClick={() => history.length > 1 ? history.back() : go("/")}>← All deals</button>
      <div className="detail-row">
        <Photo item={item} big />
        <div className="side">
          <p className="mute">{cat.name}</p>
          <h1>{item.name}</h1>
          <PriceBox top={top} />
          {top?.url && <a className="btn" href={top.url} rel="sponsored noopener" target="_blank">See it at {top.store}</a>}
        </div>
      </div>
      <h2 className="sub">Prices by store</h2>
      <Stores item={item} pct={pct} now={now} checked={checked} />
    </article>
  );
}
export default function App() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [catId, setCatId] = useState("drives");
  const [card, setCard] = useState(3);
  const [site, setSite] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("price");
  const [path, setPath] = useState(location.pathname);
  useEffect(() => {
    const on = () => setPath(location.pathname);
    addEventListener("popstate", on);
    return () => removeEventListener("popstate", on);
  }, []);

  useEffect(() => {
    const load = () => fetch("/api/deals").then((r) => r.json()).then(setData).catch(() => setErr("Could not load deals"));
    load();
    const a = setInterval(load, 10 * 60 * 1000);
    const b = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(a); clearInterval(b); };
  }, []);

  const pct = (Number(card) + Number(site)) / 100;
  const cat = data?.categories.find((c) => c.id === catId);
  const items = useMemo(() => {
    const live = (i) => i.deals.filter((d) => d.price > 0 && status(d)[1] !== "off");
    const low = (i) => Math.min(...live(i).map((d) => d.price), Infinity);
    const off = (i) => Math.max(0, ...live(i).map(offOf));
    const ends = (i) => live(i).map((d) => d.end).filter(Boolean).sort()[0] || "9999";
    const words = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const pool = words.length ? data.categories.flatMap((c) => c.items) : cat?.items ?? [];
    const by = { price: (a, b) => low(a) - low(b), off: (a, b) => off(b) - off(a) || low(a) - low(b), ends: (a, b) => ends(a).localeCompare(ends(b)) || low(a) - low(b) };
    return pool.filter((i) => words.every((w) => i.name.toLowerCase().includes(w))).sort(by[sort]);
  }, [cat, data, q, sort]);
  const firstPriced = items.findIndex((i) => i.deals.some((d) => d.price > 0));

  const open = path.startsWith("/p/") && data?.categories.flatMap((c) => c.items.map((i) => [i, c])).find(([i]) => "/p/" + slug(i.name) === path);
  useEffect(() => { document.title = open ? `${open[0].name} deal` : "Today's Deals"; }, [open]);

  const mins = data ? Math.max(0, Math.floor((now - data.dataChecked) / 60000)) : 0;
  const age = err || (data ? `Data refreshed ${mins < 60 ? mins + " min" : Math.floor(mins / 60) + " h " + (mins % 60) + " min"} ago` : "Loading deals...");

  return (
    <main>
      {open ? <p className="mute" aria-live="polite">{age}</p> : <>
      <h1>Today's Deals</h1>
      <p className="mute" aria-live="polite">{age}</p></>}
      {open ? <Detail item={open[0]} cat={open[1]} pct={pct} now={now} checked={data.dataChecked} /> : <>
      <input className="find" type="search" placeholder="Search all deals, e.g. pixel, tv, air fryer" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="ctl">
        <label>Category
          <select value={catId} onChange={(e) => setCatId(e.target.value)}>
            {data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="price">Lowest price</option>
            <option value="off">Biggest % off</option>
            <option value="ends">Ending soon</option>
          </select>
        </label>
        <label>Your card
          <select value={card} onChange={(e) => setCard(e.target.value)}>
            {CARDS.map(([n, v]) => <option key={n} value={v}>{n}</option>)}
          </select>
        </label>
        <label>Cashback site %
          <input type="number" min="0" step="0.5" value={site} onChange={(e) => setSite(e.target.value)} />
        </label>
      </div>
      {data && <BestDeals cats={data.categories} pct={pct} pick={(id) => { setCatId(id); document.getElementById("list")?.scrollIntoView({ behavior: "smooth" }); }} />}
      <Ad id="ad-top" />
      {q.trim() && items.length === 0 && <p className="soon">Nothing matches "{q}".</p>}
      {!q.trim() && cat && items.length === 0 && <p className="soon">Deals for {cat.name} are coming soon.</p>}
      <div className="grid" id="list">
        {items.map((i, n) => <Product key={i.name} item={i} pct={pct} best={sort === "price" && n === firstPriced} now={now} checked={data.dataChecked} />)}
      </div>
      </>}
      <Ad id="ad-bottom" />
      <footer>Prices are estimates and change often. Cashback rates are approximate. Some links on this page may be affiliate links; if you buy through them the site owner may earn a commission at no cost to you.</footer>
    </main>
  );
}
