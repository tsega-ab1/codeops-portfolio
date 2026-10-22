import Image from "next/image";
import Link from "next/link";

export default function DishCard({ dish, priority = false }) {
  return (
    <li className="card">
      <Image
        src={dish.image}
        alt={dish.name}
        width={600}
        height={400}
        priority={priority}
        sizes="(max-width: 600px) 100vw, 240px"
      />
      <div>
        <h2 style={{ fontSize: 20, margin: "0 0 4px" }}>
          <Link href={`/menu/${dish.id}`}>{dish.name}</Link>
        </h2>
        <p className="muted">{dish.summary}</p>
        <p><strong>{dish.price} ETB</strong></p>
      </div>
    </li>
  );
}
