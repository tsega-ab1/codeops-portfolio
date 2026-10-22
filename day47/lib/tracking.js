export const RESTAURANT = { name: "Addis Eats Kitchen", lat: 9.0182, lng: 38.7708 };

// Placeholder until checkout collects a real address.
export const DEFAULT_DELIVERY = {
  area: "Bole",
  address: "Bole, Addis Ababa",
  lat: 8.995,
  lng: 38.7896,
};

const ROUTE_PROGRESS = { received: 0, preparing: 0, ready: 0.5, delivered: 1 };
const ETA_MINUTES = { received: 45, preparing: 35, ready: 15, delivered: 0 };
const STAGE_TEXT = {
  received: "Order received, waiting for the kitchen",
  preparing: "Your food is being prepared",
  ready: "Your courier is on the way",
  delivered: "Delivered",
  cancelled: "Order cancelled",
};

export const stageText = (status) => STAGE_TEXT[status] ?? "Updating…";
export const etaMinutes = (status) => ETA_MINUTES[status] ?? 0;

// Courier sits at the kitchen until the order is ready, then moves toward you.
export function courierPosition(status, delivery = DEFAULT_DELIVERY) {
  const t = ROUTE_PROGRESS[status] ?? 0;
  return {
    lat: RESTAURANT.lat + (delivery.lat - RESTAURANT.lat) * t,
    lng: RESTAURANT.lng + (delivery.lng - RESTAURANT.lng) * t,
  };
}
