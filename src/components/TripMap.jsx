import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { mapsLink } from "@/lib/utils";

// points: [{ lat, lng, name, label, color }]
export default function TripMap({ points, city, className }) {
  const el = useRef(null);

  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    const map = L.map(el.current, { scrollWheelZoom: false }).setView(valid[0] ? [valid[0].lat, valid[0].lng] : [20, 0], valid[0] ? 12 : 2);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    valid.forEach((p) => {
      const icon = L.divIcon({
        className: "",
        html: `<div class="map-pin" style="background:${p.color}">${p.label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = p.name;
      const link = document.createElement("a");
      link.href = mapsLink(p.name, city);
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Open in Google Maps";
      link.style.cssText = "display:block;margin-top:4px;color:#37C1C3";
      popup.append(title, link);
      L.marker([p.lat, p.lng], { icon }).addTo(map).bindPopup(popup);
    });
    if (valid.length > 1) map.fitBounds(valid.map((p) => [p.lat, p.lng]), { padding: [40, 40] });
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(t);
      map.remove();
    };
  }, [points, city]);

  return <div ref={el} className={className} />;
}
