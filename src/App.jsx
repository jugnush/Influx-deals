import { useEffect, useMemo, useState } from "react";
import { findItems, slug } from "./lib/deals.js";
import { usePath } from "./lib/router.js";
import { useDeals } from "./lib/useDeals.js";
import { Ad } from "./components/parts.jsx";
import BestDeals from "./components/BestDeals.jsx";
import Filters from "./components/Filters.jsx";
import ProductCard from "./components/ProductCard.jsx";
import ProductPage from "./components/ProductPage.jsx";

function freshness(data, error, now) {
  if (error) return error;
  if (!data) return "Loading deals...";
  const m = Math.max(0, Math.floor((now - data.dataChecked) / 60000));
  return `Data refreshed ${m < 60 ? m + " min" : Math.floor(m / 60) + " h " + (m % 60) + " min"} ago`;
}

export default function App() {
  const { data, error, now } = useDeals();
  const path = usePath();
  const [f, setF] = useState({ query: "", category: "drives", sort: "price", card: 3, site: 0 });
  const set = (patch) => setF((old) => ({ ...old, ...patch }));

  const pct = (Number(f.card) + Number(f.site)) / 100;
  const categories = data?.categories ?? [];
  const category = categories.find((c) => c.id === f.category);

  const items = useMemo(() => {
    const pool = f.query.trim() ? categories.flatMap((c) => c.items) : category?.items ?? [];
    return findItems(pool, f.query, f.sort);
  }, [categories, category, f.query, f.sort]);
  const firstPriced = items.findIndex((i) => i.deals.some((d) => d.price > 0));

  const page = path.startsWith("/p/")
    && categories.flatMap((c) => c.items.map((i) => ({ item: i, category: c }))).find(({ item }) => "/p/" + slug(item.name) === path);

  useEffect(() => {
    document.title = page ? `${page.item.name} deal` : "Today's Deals";
  }, [page]);

  const status = <p className="mute" aria-live="polite">{freshness(data, error, now)}</p>;

  return (
    <main>
      {page ? (
        <>
          {status}
          <ProductPage item={page.item} category={page.category} pct={pct} now={now} checked={data.dataChecked} />
        </>
      ) : (
        <>
          <h1>Today's Deals</h1>
          {status}
          <Filters categories={categories} f={f} set={set} />
          {data && <BestDeals categories={categories} pct={pct} />}
          <Ad id="ad-top" />
          {f.query.trim() && items.length === 0 && <p className="soon">Nothing matches "{f.query}".</p>}
          {!f.query.trim() && category && items.length === 0 && <p className="soon">Deals for {category.name} are coming soon.</p>}
          <div className="grid" id="list">
            {items.map((i, n) => (
              <ProductCard key={i.name} item={i} pct={pct} best={f.sort === "price" && n === firstPriced} now={now} checked={data.dataChecked} />
            ))}
          </div>
        </>
      )}
      <Ad id="ad-bottom" />
      <footer>Prices are estimates and change often. Cashback rates are approximate. Some links on this page may be affiliate links; if you buy through them the site owner may earn a commission at no cost to you.</footer>
    </main>
  );
}
