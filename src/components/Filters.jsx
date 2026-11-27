import { CARDS } from "../lib/deals.js";

export default function Filters({ categories, f, set }) {
  return (
    <>
      <input
        className="find"
        type="search"
        placeholder="Search all deals, e.g. pixel, tv, air fryer"
        value={f.query}
        onChange={(e) => set({ query: e.target.value })}
      />
      <div className="ctl">
        <label>Category
          <select value={f.category} onChange={(e) => set({ category: e.target.value })}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label>Sort
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value })}>
            <option value="price">Lowest price</option>
            <option value="off">Biggest % off</option>
            <option value="ends">Ending soon</option>
          </select>
        </label>
        <label>Your card
          <select value={f.card} onChange={(e) => set({ card: Number(e.target.value) })}>
            {CARDS.map(([name, pct]) => <option key={name} value={pct}>{name}</option>)}
          </select>
        </label>
        <label>Cashback site %
          <input type="number" min="0" step="0.5" value={f.site} onChange={(e) => set({ site: e.target.value })} />
        </label>
      </div>
    </>
  );
}
