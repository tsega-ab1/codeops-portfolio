import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "./CartContext.jsx";

function Checkout() {
  const { items, total, dispatch } = useContext(CartContext);
  const [form, setForm] = useState({ name: "", phone: "", area: "Bole" });
  const navigate = useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  }

  function placeOrder(e) {
    e.preventDefault();
    dispatch({ type: "clear" });
    navigate("/menu", { replace: true });
  }

  return (
    <form onSubmit={placeOrder}>
      <h2>Checkout</h2>
      <p>{items.length} items — {total} ETB</p>
      <input name="name" value={form.name} onChange={handleChange} placeholder="Name" />
      <input name="phone" value={form.phone} onChange={handleChange} placeholder="Phone" />
      <select name="area" value={form.area} onChange={handleChange}>
        <option>Bole</option>
        <option>Piassa</option>
        <option>Kazanchis</option>
      </select>
      <button>Place order</button>
    </form>
  );
}

export default Checkout;
