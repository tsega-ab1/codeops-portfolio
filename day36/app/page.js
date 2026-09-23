import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Today&apos;s Specials</h2>
      <p>Fresh Doro Wat, Kitfo, and Shiro — hot from the kitchen.</p>
      <Link href="/menu" className="underline">
        See the full menu
      </Link>
    </div>
  );
}
