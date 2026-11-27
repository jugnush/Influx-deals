import { bestOf, slug } from "../lib/deals.js";
import { go } from "../lib/router.js";
import { Photo, PriceBox, Stores } from "./parts.jsx";

export default function ProductCard({ item, pct, best, now, checked }) {
  const href = "/p/" + slug(item.name);
  const open = (e) => { e.preventDefault(); go(href); };

  return (
    <article className={"card" + (best ? " best" : "")}>
      {best && <span className="badge">Lowest</span>}
      <a className="row" href={href} onClick={open}>
        <Photo item={item} />
        <div className="side">
          <h2 className="drive">{item.name}</h2>
          <PriceBox top={bestOf(item, pct)} />
        </div>
      </a>
      <Stores item={item} pct={pct} now={now} checked={checked} />
    </article>
  );
}
