import React, { useEffect, useRef } from "react";

export default function LocationMap({ lat, lon, name }) {
  const ref = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    function init() {
      if (cancelled || !ref.current || !window.L) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
      mapRef.current = window.L.map(ref.current, { zoomControl: false, attributionControl: false }).setView([lat, lon], 8);
      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(mapRef.current);
      window.L.marker([lat, lon]).addTo(mapRef.current).bindPopup(name);
    }

    if (window.L) { init(); return () => { cancelled = true; }; }

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = init;
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [lat, lon, name]);

  return <div ref={ref} className="h-[150px] rounded-lg bg-panel2" />;
}
