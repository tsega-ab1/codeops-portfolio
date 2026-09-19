import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./AuthContext.jsx";
import { ThemeProvider } from "./ThemeContext.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";
import AppCrashed from "./AppCrashed.jsx";
import MenuUnavailable from "./MenuUnavailable.jsx";
import CartUnavailable from "./CartUnavailable.jsx";
import Layout from "./Layout.jsx";
import Home from "./Home.jsx";
import Menu from "./Menu.jsx";
import DishDetail from "./DishDetail.jsx";
import Cart from "./Cart.jsx";
import Login from "./Login.jsx";
import NotFound from "./NotFound.jsx";
import RequireAuth from "./RequireAuth.jsx";

// Split out of the main bundle — nobody browsing the menu should
// have to download the checkout form and receipt page first.
const Checkout = lazy(() => import("./Checkout.jsx"));
const Receipt = lazy(() => import("./Receipt.jsx"));

function RouteSkeleton() {
  return <p>Loading…</p>;
}

function App() {
  return (
    <ErrorBoundary fallback={<AppCrashed />}>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route
                  path="menu"
                  element={
                    <ErrorBoundary fallback={<MenuUnavailable />}>
                      <Menu />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="menu/:id"
                  element={
                    <ErrorBoundary fallback={<MenuUnavailable />}>
                      <DishDetail />
                    </ErrorBoundary>
                  }
                />
                <Route
                  path="cart"
                  element={
                    <ErrorBoundary fallback={<CartUnavailable />}>
                      <Cart />
                    </ErrorBoundary>
                  }
                />
                <Route path="login" element={<Login />} />
                <Route
                  path="checkout"
                  element={
                    <RequireAuth>
                      <Suspense fallback={<RouteSkeleton />}>
                        <Checkout />
                      </Suspense>
                    </RequireAuth>
                  }
                />
                <Route
                  path="receipt"
                  element={
                    <Suspense fallback={<RouteSkeleton />}>
                      <Receipt />
                    </Suspense>
                  }
                />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
