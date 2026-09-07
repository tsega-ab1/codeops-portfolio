import { Outlet, NavLink } from "react-router-dom";
import { useContext } from "react";
import { CartContext } from "./CartContext.jsx";

function Layout() {
  const { items } = useContext(CartContext);

  return (
    <div>
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
            Cart ({items.length})
          </NavLink>
        </nav>
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
