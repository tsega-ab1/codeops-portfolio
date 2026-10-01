import { orders } from "@/lib/orders";

export default function OrdersPage() {
  return (
    <main className="page-container">
      <h1 className="page-title">Orders</h1>

      {orders.length === 0 && <p>No orders yet.</p>}

      <div className="dish-grid">
        {orders.map((order) => (
          <div className="dish-card" key={order.id}>
            <div className="dish-content">
              <h2>{order.name}</h2>
              <p className="dish-description">Phone: {order.phone}</p>
              <p className="dish-price">
                {order.total} {order.currency}
              </p>
              {order.cancelled && <p className="err">Cancelled</p>}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
