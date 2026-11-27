export function affiliateLinks(env = process.env) {
  const templates = { "Walmart": env.WALMART_AFFILIATE, "Best Buy": env.BESTBUY_AFFILIATE };

  const tag = (deal) => {
    const t = templates[deal.store];
    if (!t || !deal.url) return deal;
    const target = encodeURIComponent(deal.url);
    return { ...deal, url: t.includes("{url}") ? t.replace("{url}", target) : t + target };
  };

  return (data) => {
    if (!templates.Walmart && !templates["Best Buy"]) return data;
    return {
      ...data,
      categories: data.categories.map((c) => ({
        ...c,
        items: c.items.map((i) => ({ ...i, deals: i.deals.map(tag) }))
      }))
    };
  };
}
