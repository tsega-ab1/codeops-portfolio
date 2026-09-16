import { Outlet, NavLink } from "react-router-dom";
import { useCartStore } from "./cartStore.js";
import { useTheme } from "./useTheme.js";

function Layout() {
  // narrow selector: only the count, not the whole store
  const count = useCartStore((s) => s.items.length);
  const { theme, toggle } = useTheme();

  return (
    <div className={theme}>
      <header>
        <h1>Addis Eats</h1>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}>
            Home
          </NavLink>
          <NavLink to="/menu" className={({ isActive }) => (isActive ? "on" : "")}>
            Menu
          </NavLink>
          <NavLink to="/cart" className={({ isActive }) => (isActive ? "on" : "")}>
            Cart ({count})
          </NavLink>
        </nav>
        <button onClick={toggle}>Theme: {theme}</button>
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        <p>Addis Eats — CodeOps portfolio project</p>
      </footer>
    </div>
  );
}

export default Layout;
