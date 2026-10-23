import { NextResponse } from "next/server";
import { searchDishes } from "@/lib/dishes";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").slice(0, 60);
  const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;

  return NextResponse.json(await searchDishes({ q, page }));
}
