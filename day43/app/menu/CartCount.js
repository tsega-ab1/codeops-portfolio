"use client";

import { useQuery } from "@tanstack/react-query";

async function getCart() {
  const response = await fetch("/api/cart");
  if (!response.ok) throw new Error("Failed to fetch cart");
  return response.json();
}

export default function CartCount() {
  const { data } = useQuery({
    queryKey: ["cart"],
    queryFn: getCart,
    staleTime: 0, // cart state is stale immediately
  });

  return <p className="mb-4 font-medium">Items in cart: {data?.length ?? 0}</p>;
}
