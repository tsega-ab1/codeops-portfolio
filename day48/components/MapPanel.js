"use client";

import dynamic from "next/dynamic";

// ssr:false is required: Leaflet touches window the moment it is imported.
const DeliveryMap = dynamic(() => import("./DeliveryMap"), {
  ssr: false,
  loading: () => <div className="map-placeholder" style={{ height: 320 }}>Loading map…</div>,
});

export default function MapPanel(props) {
  return <DeliveryMap {...props} />;
}
