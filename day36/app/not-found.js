import Link from "next/link";

export default function NotFound() {
  return (
    <div>
      <h2 className="text-xl font-semibold">Page not found</h2>
      <Link href="/" className="underline">
        Go home
      </Link>
    </div>
  );
}
