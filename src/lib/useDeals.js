import { useEffect, useState } from "react";

export function useDeals() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const load = () => fetch("/api/deals")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setError("Could not load deals"));
    load();
    const reload = setInterval(load, 10 * 60 * 1000);
    const tick = setInterval(() => setNow(Date.now()), 30000);
    return () => { clearInterval(reload); clearInterval(tick); };
  }, []);

  return { data, error, now };
}
