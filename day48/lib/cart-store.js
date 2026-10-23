// Cart lives in the browser (localStorage). Only call these from client code.
const KEY = "cart";

export function readCart() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart-change"));
}

export function addToCart(dish) {
  const cart = readCart();
  const found = cart.find((i) => i.id === dish.id);
  if (found) found.qty += 1;
  else cart.push({ id: dish.id, name: dish.name, price: dish.price, qty: 1 });
  writeCart(cart);
}

export function setQty(id, qty) {
  const cart = readCart()
    .map((i) => (i.id === id ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  writeCart(cart);
}

export function clearCart() {
  writeCart([]);
}

export const cartTotal = (cart) => cart.reduce((sum, i) => sum + i.price * i.qty, 0);
