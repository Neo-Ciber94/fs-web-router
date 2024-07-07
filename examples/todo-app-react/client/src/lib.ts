const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("API_URL is not defined");
}

export async function fetchJSON(path: string, init?: FetchRequestInit) {
  const url = `${API_URL}${path}`;
  const res = await fetch(url, init);

  if (!res.ok) {
    throw new Error("Failed to fetch JSON");
  }

  const json = await res.json();
  return json as unknown;
}
