export async function serp(params) {
  const url = "https://serpapi.com/search.json?" + new URLSearchParams({ ...params, api_key: process.env.SERPAPI_KEY });
  const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
  const body = await res.json();
  if (!res.ok || body.error) throw new Error(body.error || "SerpApi " + res.status);
  return body;
}
