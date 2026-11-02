// Free place search via OpenStreetMap Nominatim (no API key needed).
export async function searchPlaces(q, signal) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("Place search failed");
  const rows = await res.json();
  const seen = new Set();
  return rows
    .map((r) => {
      const a = r.address || {};
      const label = [r.name || a.city || a.town || a.village, a.state, a.country]
        .filter(Boolean)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .join(", ");
      return { label, lat: Number(r.lat), lng: Number(r.lon) };
    })
    .filter((r) => r.label && !seen.has(r.label) && seen.add(r.label));
}
