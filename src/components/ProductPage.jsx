import { bestOf } from "../lib/deals.js";
import { go } from "../lib/router.js";
import { Photo, PriceBox, Stores } from "./parts.jsx";

export default function ProductPage({ item, category, pct, now, checked }) {
  const top = bestOf(item, pct);

  return (
    <article className="detail">
      <button className="back" onClick={() => history.length > 1 ? history.back() : go("/")}>← All deals</button>
      <div className="detail-row">
        <Photo item={item} big />
        <div className="side">
          <p className="mute">{category.name}</p>
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
