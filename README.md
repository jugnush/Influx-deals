# INFLUX DEALS

A deals comparison site that puts Walmart and Best Buy prices side by side and shows what you actually pay after credit card and cashback-site rewards.

Live: https://influx-deals.onrender.com

![CI](https://github.com/jugnush/Influx-deals/actions/workflows/ci.yml/badge.svg)

## Architecture

```
 GitHub Actions (every 5 days)              GitHub Actions (every push)
 ┌───────────────────────────────┐          ┌──────────────────────────┐
 │ update-prices                 │          │ CI: npm test, npm build  │
 │  scheduled providers          │          └──────────────────────────┘
 │   └─ Walmart (SerpApi)        │
 │  match + sanity checks        │
 │  test + build                 │
 │  commit products.json ────────┼──┐
 │  open issue on failure        │  │
 └───────────────────────────────┘  │
                                    ▼
                          ┌───────────────────┐   auto deploy
                          │  GitHub (main)    │─────────────────┐
                          └───────────────────┘                 ▼
                       ┌──────────────────────────────────────────────┐
                       │ Render web service  (Node.js / Express)      │
                       │  GET /api/deals                              │
                       │   catalog (products.json)                    │
                       │   live providers ── Best Buy Products API    │
                       │   30 min in-memory cache                     │
                       │   product images, affiliate links            │
                       │  GET /healthz                                │
                       │  serves the React build                      │
                       └───────────────────────┬──────────────────────┘
                                               │ JSON
                                               ▼
                       ┌──────────────────────────────────────────────┐
                       │ React 18 + Vite                              │
                       │  best deals, search, sort, ending soon       │
                       │  cashback math, product pages                │
                       └──────────────────────────────────────────────┘
```

### Design decisions

**The repo is the database.** The catalog is small and read-heavy, so prices live in `server/data/products.json`. A scheduled workflow updates it and commits the result. Every price change is versioned and reviewable with `git log`, and a commit is also the deploy trigger. No database to run or pay for.

**Two kinds of providers, one interface.** Each store is a provider with the same shape:

```js
{ store, mode: "live" | "scheduled", enabled(), fetch(item, oldDeal) }
```

`live` providers (Best Buy, free API) run inside the server behind a 30 minute cache. `scheduled` providers (Walmart via SerpApi, paid per call) only run in the workflow, so a cold start on the free hosting tier never spends API quota. Adding a store means adding one file in `server/providers/`.

**Trust the data before showing it.** `server/match.js` decides whether a search result is really the same product:

- model numbers and capacities must match exactly (`2TB` is not `5TB`)
- variants must match both ways (`Pixel 11` is not `Pixel 11 Pro`, refurbished is rejected)
- a new price outside 0.3x to 3x of the last known price is dropped
- Walmart results from third-party sellers are ignored

**Fail loudly.** If more than half of the lookups fail, the job exits non-zero, nothing is committed, and an issue is opened in the repo with a link to the logs.

**Monetization is configuration.** Affiliate links are injected at response time from environment variables, so turning them on needs no code change.

## Running locally

```bash
npm install
npm run build
npm start          # http://localhost:3000
npm test
```

## Configuration

| Variable | Where | Purpose |
|---|---|---|
| `BESTBUY_KEY` | Render | Best Buy Products API key, enables live Best Buy prices |
| `SERPAPI_KEY` | GitHub Actions secret | Walmart prices for the scheduled job |
| `WALMART_AFFILIATE` | Render | Tracking link, `{url}` is replaced with the product link |
| `BESTBUY_AFFILIATE` | Render | Same, for Best Buy |

Keys are never stored in the repo.

## Project layout

```
server/
  index.js            API, cache, static hosting
  update.js           scheduled price job
  match.js            product matching and price checks
  affiliate.js        affiliate link injection
  catalog.js          reads products.json
  providers/          one file per store
  data/products.json  catalog and prices
src/
  App.jsx
  components/         BestDeals, Filters, ProductCard, ProductPage
  lib/                deal math, routing, data loading
test/                 node:test suites
.github/workflows/    ci.yml, prices.yml
```

## Notes

Amazon prices are intentionally not shown. Prices and dates in the catalog are checked against the store pages, and anything that cannot be confirmed is left blank instead of guessed.
