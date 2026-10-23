import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { cancelOrderAs } from "@/lib/db";

// Same guard as the cancelOrder server action, reachable with curl for testing.
export async function POST(_request, { params }) {
  const { id } = await params;
  const user = await getSession();

  const result = cancelOrderAs(user, id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json({ id, status: result.order.status });
}
