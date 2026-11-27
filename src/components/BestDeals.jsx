import { money, slug, status, topDeals } from "../lib/deals.js";
import { go } from "../lib/router.js";

export default function BestDeals({ categories, pct }) {
  const list = topDeals(categories);
  if (!list.length) return null;

  return (
    <section className="top">
      <h2>Best deals right now</h2>
      <div className="topgrid">
        {list.map((d) => {
          const [label, tone] = status(d);
          return (
            <button key={d.name} className="topcard" onClick={() => go("/p/" + slug(d.name))}>
              {d.image && <img src={d.image} alt="" loading="lazy" />}
              <span className="off">{d.off}% off</span>
              <span className="tname">{d.name}</span>
              <span className="tprice">{money(d.price * (1 - pct))}</span>
              <span className="fin">{d.store} · was {money(d.regular)} · save {money(d.regular - d.price)}</span>
              <span className={"fin" + (tone === "warn" ? " hurry" : "")}>
                {d.end ? label.replace("On until", "Ends") : "No end date listed"} · {d.cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
