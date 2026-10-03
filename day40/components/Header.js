import Link from "next/link";
import CartBadge from "./CartBadge";

export default function Header() {
  return (
    <header className="site-header">
      <div className="header-container">
        <Link href="/" className="logo">
          Addis Eats
        </Link>
        <nav className="main-nav">
          <Link href="/">Home</Link>
          <Link href="/menu">Menu</Link>
          <CartBadge />
          <Link href="/checkout">Checkout</Link>
          <Link href="/orders">Orders</Link>
        </nav>
      </div>
    </header>
  );
}
