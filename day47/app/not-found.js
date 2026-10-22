import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>We could not find what you were looking for.</p>
      <p><Link href="/menu">Back to the menu</Link></p>
    </section>
  );
}
