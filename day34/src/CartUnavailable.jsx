function CartUnavailable() {
  return (
    <div className="err">
      <p>Your cart couldn't be displayed.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
}

export default CartUnavailable;
