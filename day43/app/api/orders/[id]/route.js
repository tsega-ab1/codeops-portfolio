import { getSession } from "@/lib/session";
import { findOrder, canViewOrder } from "@/lib/orders";

// Proxy does not cover /api/orders, so this handler is the only gate.
export async function GET(request, { params }) {
  const { id } = await params;

  const session = await getSession();
  if (!session) {
    return Response.json({ message: "Not signed in" }, { status: 401 });
  }

  const order = findOrder(id);

  // 404 for both "missing" and "not yours".
  if (!order || !canViewOrder(session, order)) {
    return Response.json({ message: "Order not found" }, { status: 404 });
  }

  return Response.json(order);
}
