"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // without this the tiles render broken
import { RESTAURANT, courierPosition } from "@/lib/tracking";

// divIcon avoids Leaflet's default-marker image problem under bundlers.
const pin = (emoji) =>
  L.divIcon({ className: "map-pin", html: emoji, iconSize: [36, 36], iconAnchor: [18, 18] });
const COURIER_ICON = pin("🛵");
const HOME_ICON = pin("📍");
const KITCHEN_ICON = pin("🍲");

function FitBounds({ points }) {
  const map = useMap();
  const key = points.flat().join();
  useEffect(() => {
    map.fitBounds(points, { padding: [40, 40], maxZoom: 15 });
  }, [map, key]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function DeliveryMap({ status, delivery }) {
  const courier = courierPosition(status, delivery);
  const c = [courier.lat, courier.lng];        // Leaflet is [lat, lng]
  const home = [delivery.lat, delivery.lng];
  const kitchen = [RESTAURANT.lat, RESTAURANT.lng];

  return (
    <div className="map-wrap" role="region" aria-label="Delivery map">
      <MapContainer center={home} zoom={14} scrollWheelZoom={false} style={{ height: 320, width: "100%" }}>
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <Marker position={kitchen} icon={KITCHEN_ICON} title="Kitchen"><Popup>{RESTAURANT.name}</Popup></Marker>
        <Marker position={home} icon={HOME_ICON} title="Delivery address"><Popup>{delivery.address}</Popup></Marker>
        <Marker position={c} icon={COURIER_ICON} title="Courier"><Popup>Your courier</Popup></Marker>
        {status === "ready" && <Polyline positions={[c, home]} dashArray="6 8" />}
        <FitBounds points={[kitchen, home, c]} />
      </MapContainer>
    </div>
  );
}
