import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getOrderAs, setStatusAs } from "@/lib/db";

// Polled by the order page. Owner or staff only.
export async function GET(_request, { params }) {
  const { id } = await params;
  const user = await getSession();

  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const order = getOrderAs(user, id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ id: order.id, status: order.status });
}

// Staff only.
export async function PATCH(request, { params }) {
  const { id } = await params;
  const user = await getSession();
  const body = await request.json().catch(() => ({}));

  const result = setStatusAs(user, id, body.status);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ id, status: result.order.status });
}
