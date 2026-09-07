import { CartProvider } from "./CartContext.jsx";
import CartBadge from "./CartBadge.jsx";
import CheckoutPanel from "./CheckoutPanel.jsx";
import Menu from "./Menu.jsx";

function App() {
  return (
    <CartProvider>
      <div>
        <h1>Addis Eats</h1>
        <CartBadge />
        <Menu />
        <CheckoutPanel />
      </div>
    </CartProvider>
  );
}

export default App;
