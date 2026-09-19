import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "./cartStore.js";
import { validate } from "./validate.js";
import Field from "./Field.jsx";

const areas = ["Bole", "Kazanchis", "Megenagna", "Piassa"];

function Checkout() {
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);
  const total = items.reduce((sum, d) => sum + d.price, 0);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    area: "Bole",
    notes: "",
  });
  const [touched, setTouched] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  const navigate = useNavigate();

  // Derived on every render — can never disagree with the values.
  const errors = validate(form);
  const hasErrors = Object.keys(errors).length > 0;

  function handleChange(e) {
    const { name, value } = e.target;
    // updater form: reads the latest state, not the value
    // captured at render — matters when fields change quickly
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleBlur(e) {
    const { name } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }

  function show(field) {
    return touched[field] ? errors[field] : undefined;
  }

  // Simulates a real request: fails about a third of the time so the
  // failure path (Part 1's "failed" state) is actually exercisable.
  function submitOrder(payload) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.3) {
          reject(new Error("The kitchen's order system is briefly unavailable."));
        } else {
          resolve({ id: Math.floor(Math.random() * 10000) });
        }
      }, 700);
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting) return; // no double order

    // Touch every field so all errors become visible on submit,
    // not just the ones already blurred.
    setTouched({ name: true, phone: true, area: true, notes: true });

    if (hasErrors) {
      const firstError = Object.keys(errors)[0];
      document.getElementById(firstError)?.focus();
      return;
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const order = await submitOrder({ ...form, items, total });
      clear();
      navigate(`/`, { replace: true, state: { orderPlaced: order.id } });
    } catch (err) {
      // Every value stays in the form — never clear on failure.
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h2>Checkout</h2>
      <p>{items.length} items — {total} ETB</p>

      <Field id="name" label="Name" error={show("name")}>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!show("name")}
          aria-describedby={show("name") ? "name-error" : undefined}
        />
      </Field>

      <Field id="phone" label="TeleBirr number" error={show("phone")}>
        <input
          id="phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="09… or +2519…"
          aria-invalid={!!show("phone")}
          aria-describedby={show("phone") ? "phone-error" : undefined}
        />
      </Field>

      <Field id="area" label="Delivery area" error={show("area")}>
        <select
          id="area"
          name="area"
          value={form.area}
          onChange={handleChange}
          onBlur={handleBlur}
          aria-invalid={!!show("area")}
          aria-describedby={show("area") ? "area-error" : undefined}
        >
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
      </Field>

      <Field id="notes" label="Notes (optional)">
        <textarea
          id="notes"
          name="notes"
          value={form.notes}
          onChange={handleChange}
        />
      </Field>

      {serverError && <p role="alert" className="err">{serverError}</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? "Sending your order…" : `Order — ${total} ETB`}
      </button>
    </form>
  );
}

export default Checkout;
