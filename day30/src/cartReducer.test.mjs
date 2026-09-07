import { cartReducer } from "./cartReducer.js";

let state = { items: [] };

state = cartReducer(state, { type: "add", dish: { id: 1, name: "Shiro", price: 120 } });
console.assert(state.items.length === 1, "add should add one item");

state = cartReducer(state, { type: "add", dish: { id: 2, name: "Tibs", price: 280 } });
console.assert(state.items.length === 2, "add should add a second item");

state = cartReducer(state, { type: "remove", id: 1 });
console.assert(state.items.length === 1 && state.items[0].id === 2, "remove should remove only the matching item");

state = cartReducer(state, { type: "clear" });
console.assert(state.items.length === 0, "clear should empty the cart");

console.log("cartReducer: all checks passed");
