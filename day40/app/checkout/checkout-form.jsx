"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions";
import { dishes } from "@/lib/dishes-data";
import SubmitButton from "./submit-button";

const initialState = {
  error: "",
  fieldErrors: {},
  success: false,
};

export default function CheckoutForm() {
  const [state, formAction] = useActionState(placeOrder, initialState);

  if (state.success) {
    return (
      <div className="checkout-card">
        <p>Order placed! Your order id is {state.orderId}.</p>
        <a href="/orders" className="primary-button">
          View Orders
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} className="checkout-card">
      <div className="field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" />
        {state.fieldErrors?.name && (
          <p role="alert" className="err">
            {state.fieldErrors.name[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="phone">Phone</label>
        <input id="phone" name="phone" placeholder="09... or +2519..." />
        {state.fieldErrors?.phone && (
          <p role="alert" className="err">
            {state.fieldErrors.phone[0]}
          </p>
        )}
      </div>

      <div className="field">
        <label htmlFor="dishId">Dish</label>
        <select id="dishId" name="dishId">
          {dishes.map((dish) => (
            <option key={dish.id} value={dish.id}>
              {dish.name} — {dish.price} ETB
            </option>
          ))}
        </select>
        {state.fieldErrors?.dishId && (
          <p role="alert" className="err">
            {state.fieldErrors.dishId[0]}
          </p>
        )}
      </div>

      {state.error && !state.fieldErrors?.name && !state.fieldErrors?.phone && (
        <p role="alert" className="err">
          {state.error}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
