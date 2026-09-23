import Link from "next/link";

export default function DishList({ dishes }) {
  if (dishes.length === 0) {
    return <p>No dishes in this category yet.</p>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {dishes.map((d) => (
        <Link
          key={d.id}
          href={`/menu/${d.id}`}
          className="block rounded-lg border p-4 hover:bg-gray-50"
        >
          <h3 className="font-semibold">{d.name}</h3>
          <p>{d.price} ETB</p>
        </Link>
      ))}
    </div>
  );
}
