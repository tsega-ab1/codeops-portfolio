import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await fetch(url, { signal: ctrl.signal });
        if (!res.ok) throw new Error("Could not load the menu");
        setData(await res.json());
      } catch (e) {
        if (e.name !== "AbortError") setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [url]);

  return { data, loading, error };
}
