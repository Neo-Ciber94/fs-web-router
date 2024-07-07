import { useEffect, useState } from "react";

export default function App() {
  const { data, error, isLoading } = useFetch("http://localhost:5000/api/data");

  return (
    <div>
      {isLoading && <p>Loading...</p>}
      {!isLoading && <p>{JSON.stringify(data)}</p>}
      {error != null && <p>{error instanceof Error ? error.message : "Server Error"}</p>}
    </div>
  );
}

function useFetch<T = unknown>(url: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let discard = false;
    const abortController = new AbortController();

    setError(null);

    async function run() {
      try {
        if (discard) {
          return;
        }

        const res = await fetch(url, {
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`http error: ${res.status}`);
        }

        if (discard) {
          return;
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(new Error("Failed to fetch"));
      } finally {
        setIsLoading(false);
      }
    }

    run().catch((err) => setError(err));

    return () => {
      discard = true;
      abortController.abort();
    };
  }, [url]);

  return { data, error, isLoading };
}
