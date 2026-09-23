import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Addis Eats — Next.js",
  description: "The Day 36 Addis Eats route tree, built with Next.js file-based routing.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="max-w-3xl mx-auto p-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">Addis Eats</h1>
          <nav className="flex gap-4 mt-2">
            <Link href="/">Home</Link>
            <Link href="/menu">Menu</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
