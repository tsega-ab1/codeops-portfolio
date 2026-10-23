import Link from "next/link";
import { getSession } from "@/lib/session";
import { signOut } from "@/app/actions";

export default async function Nav() {
  const user = await getSession();

  return (
    <header>
      <nav aria-label="Main">
        <Link href="/"><strong>Addis Eats</strong></Link>
        <Link href="/menu">Menu</Link>
        <Link href="/cart">Cart</Link>
        {user && <Link href="/orders">My orders</Link>}
        {user?.role === "staff" && <Link href="/kitchen">Kitchen</Link>}
        {user ? (
          <form action={signOut}>
            <span className="muted">{user.name} </span>
            <button type="submit">Sign out</button>
          </form>
        ) : (
          <Link href="/signin" style={{ marginLeft: "auto" }}>Sign in</Link>
        )}
      </nav>
    </header>
  );
}
