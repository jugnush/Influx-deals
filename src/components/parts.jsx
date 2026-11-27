import { ago, money, percentOff, shortDate, status } from "../lib/deals.js";

export function Ad({ id }) {
  return <div className="ad" id={id}>Ad space</div>;
}

export function Photo({ item, big }) {
  const cls = big ? "hero-pic" : "pic";
  return item.image
    ? <img className={cls} src={item.image} alt={item.name} loading={big ? "eager" : "lazy"} />
    : <div className={cls + " nopic"}>No photo yet</div>;
}

export function PriceBox({ top }) {
  if (!top) return <div className="nop">No price shown here yet.</div>;
  const off = percentOff(top);
  return (
    <>
      {off > 0 && <span className="off">{off}% off</span>}
      <div className="price">{money(top.fin)}</div>
      <div className="fin">at {top.store} · list {money(top.price)}{off > 0 ? ` · was ${money(top.regular)}` : ""}</div>
    </>
  );
}

function Source({ deal, now, checked }) {
  const text = deal.at ? `Live · ${ago(deal.at, now)}` : `Checked ${shortDate(checked)}`;
  const cls = "src" + (deal.at ? " live" : "");
  return deal.url
    ? <a className={cls} href={deal.url} rel="sponsored noopener" target="_blank">{text}</a>
    : <span className={cls}>{text}</span>;
}

export function Stores({ item, pct, now, checked }) {
  const priced = item.deals
    .filter((d) => d.price > 0)
    .map((d) => ({ ...d, fin: d.price * (1 - pct) }))
    .sort((a, b) => a.fin - b.fin);
  const hidden = item.deals.filter((d) => d.noPrice);

  return (
    <ul className="stores">
      {priced.map((d) => {
        const [label, tone] = status(d);
        return (
          <li key={d.store}>
            <span>{d.store}</span>
            <b>{money(d.fin)}</b>
            <span className={"pill " + tone}>{label}</span>
            <Source deal={d} now={now} checked={checked} />
          </li>
        );
      })}
      {hidden.map((d) => (
        <li key={d.store}>
          <span>{d.store}</span>
          <span className="mute">Price not shown here</span>
          {d.url && <a href={d.url} rel="sponsored noopener">View</a>}
        </li>
      ))}
    </ul>
  );
}
