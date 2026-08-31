import { useState } from "react";

function OrderForm() {
  const [form, setForm] = useState({ name: "", phone: "", area: "Bole" });

  const valid = /^(?:\+251|0)9\d{8}$/.test(form.phone);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    alert(`Delivering to ${form.name} in ${form.area}`);
  }

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        placeholder="Your name"
      />
      <input
        name="phone"
        value={form.phone}
        onChange={handleChange}
        placeholder="09... or +2519..."
      />
      <select name="area" value={form.area} onChange={handleChange}>
        <option>Bole</option>
        <option>Piassa</option>
        <option>Kazanchis</option>
      </select>

      {form.phone && !valid && <p className="err">Use 09... or +2519...</p>}

      <button disabled={!valid}>Pay with TeleBirr</button>
    </form>
  );
}

export default OrderForm;
