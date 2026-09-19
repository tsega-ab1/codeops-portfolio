import { useLocation, Link } from "react-router-dom";

function Receipt() {
  const location = useLocation();
  const orderId = location.state?.orderPlaced;

  return (
    <div>
      <h2>Order placed</h2>
      {orderId ? <p>Your order #{orderId} is on its way.</p> : <p>No recent order found.</p>}
      <Link to="/menu">Back to the menu</Link>
    </div>
  );
}

export default Receipt;
