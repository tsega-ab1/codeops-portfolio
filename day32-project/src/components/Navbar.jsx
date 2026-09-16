import { NavLink } from "react-router-dom";
import { useTheme } from "../context/useTheme.js";

function link(isActive) {
  return isActive ? "on" : "";
}

function Navbar() {
  const { theme, toggle } = useTheme();

  return (
    <nav className="navbar">
      <span className="brand">CampusConnect</span>
      <div className="links">
        <NavLink to="/" end className={({ isActive }) => link(isActive)}>Home</NavLink>
        <NavLink to="/clubs" className={({ isActive }) => link(isActive)}>Clubs</NavLink>
        <NavLink to="/events" className={({ isActive }) => link(isActive)}>Events</NavLink>
        <NavLink to="/resources" className={({ isActive }) => link(isActive)}>Resources</NavLink>
        <NavLink to="/about" className={({ isActive }) => link(isActive)}>About</NavLink>
      </div>
      <button onClick={toggle}>Theme: {theme}</button>
    </nav>
  );
}

export default Navbar;
