import { useEffect, useMemo, useState } from "react";

const CARDS = [
  ["Bank of America 3%", 3], ["Apple Card + Apple Pay 2%", 2], ["Citi / Wells Fargo 2%", 2],
  ["Capital One / Chase Freedom 1.5%", 1.5], ["No card cashback", 0]
];
const today = () => new Date().toISOString().slice(0, 10);
const money = (n) => "$" + n.toFixed(2);
function status(d) {
  const t = today();
  if (d.start && t < d.start) return ["Not started", "off"];
  if (d.end && t > d.end) return ["Ended", "off"];
  return [d.end ? `On until ${d.end}` : "On", "on"];
}
function BestDeals({ cats, pct, pick }) {
  const list = cats.flatMap((c) => c.items.flatMap((i) => i.deals
    .filter((d) => d.price > 0 && d.regular > d.price && status(d)[1] === "on")
    .map((d) => ({ ...d, cat: c, name: i.name, off: Math.round((1 - d.price / d.regular) * 100) }))))
    .sort((a, b) => b.off - a.off || (b.regular - b.price) - (a.regular - a.price))
    .filter((d, n, all) => all.findIndex((x) => x.name === d.name) === n)
    .slice(0, 4);
  if (!list.length) return null;
  return (
    <section className="top">
      <h2>Best deals right now</h2>
      <div className="topgrid">
        {list.map((d) => (
          <button key={d.name} className="topcard" onClick={() => pick(d.cat.id)}>
            <span className="off">{d.off}% off</span>
            <span className="tname">{d.name}</span>
            <span className="tprice">{money(d.price * (1 - pct))}</span>
            <span className="fin">{d.store} · was {money(d.regular)} · save {money(d.regular - d.price)}</span>
            <span className="fin">{d.end ? `Ends ${d.end}` : "No end date listed"} · {d.cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
function Ad({ id }) { return <div className="ad" id={id}>Ad space</div>; }

function Product({ item, pct, best }) {
  const priced = item.deals.filter((d) => d.price > 0).map((d) => ({ ...d, fin: d.price * (1 - pct) })).sort((a, b) => a.fin - b.fin);
  const blank = item.deals.filter((d) => d.noPrice);
  const top = priced[0];
  return (
    <article className={"card" + (best ? " best" : "")}>
      {best && <span className="badge">Lowest</span>}
      <h2 className="drive">{item.name}</h2>
      {top ? (<>
        <div className="price">{money(top.fin)}</div>
        <div className="fin">best at {top.store} (list {money(top.price)}{top.regular > top.price ? `, was ${money(top.regular)}` : ""})</div>
      </>) : <div className="nop">No price shown here yet.</div>}
      <ul className="stores">
        {priced.map((d) => {
          const [label, tone] = status(d);
          return <li key={d.store}><span>{d.store}</span><b>{money(d.fin)}</b><span className={"pill " + tone}>{label}</span>
            {d.url && <a href={d.url} rel="sponsored noopener">View</a>}</li>;
        })}
        {blank.map((d) => <li key={d.store}><span>{d.store}</span><span className="mute">Price not shown here</span>
          {d.url && <a href={d.url} rel="sponsored noopener">View</a>}</li>)}
      </ul>
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
    const low = (i) => Math.min(...i.deals.filter((d) => d.price > 0).map((d) => d.price), Infinity);
    return [...(cat?.items ?? [])].sort((a, b) => low(a) - low(b));
  }, [cat]);
  const firstPriced = items.findIndex((i) => i.deals.some((d) => d.price > 0));

  const mins = data ? Math.max(0, Math.floor((now - data.dataChecked) / 60000)) : 0;
  const age = err || (data ? `Data refreshed ${mins < 60 ? mins + " min" : Math.floor(mins / 60) + " h " + (mins % 60) + " min"} ago` : "Loading deals...");

  return (
    <main>
      <h1>Today's Deals</h1>
      <p className="mute" aria-live="polite">{age}</p>
      <div className="ctl">
        <label>Category
          <select value={catId} onChange={(e) => setCatId(e.target.value)}>
            {data?.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
      {cat && items.length === 0 && <p className="soon">Deals for {cat.name} are coming soon.</p>}
      <div className="grid" id="list">
        {items.map((i, n) => <Product key={i.name} item={i} pct={pct} best={n === firstPriced} />)}
      </div>
      <Ad id="ad-bottom" />
      <footer>Prices are estimates and change often. Cashback rates are approximate. Some links on this page may be affiliate links; if you buy through them the site owner may earn a commission at no cost to you.</footer>
    </main>
  );
}
