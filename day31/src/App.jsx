import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import { AuthProvider } from "./AuthContext.jsx";
import Layout from "./Layout.jsx";
import Home from "./Home.jsx";
import Menu from "./Menu.jsx";
import DishDetail from "./DishDetail.jsx";
import Cart from "./Cart.jsx";
import Checkout from "./Checkout.jsx";
import Login from "./Login.jsx";
import NotFound from "./NotFound.jsx";
import RequireAuth from "./RequireAuth.jsx";

function App() {
  return (
    <CartProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="menu" element={<Menu />} />
              <Route path="menu/:id" element={<DishDetail />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route
                path="checkout"
                element={
                  <RequireAuth>
                    <Checkout />
                  </RequireAuth>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </CartProvider>
  );
}

export default App;
