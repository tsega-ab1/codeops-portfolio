import { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./AuthContext.jsx";

function Login() {
  const [phone, setPhone] = useState("");
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname ?? "/menu";

  async function handleSubmit(e) {
    e.preventDefault();
    await login(phone);
    navigate(from, { replace: true });
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Sign in</h2>
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="09... or +2519..."
      />
      <button>Sign in</button>
    </form>
  );
}

export default Login;
