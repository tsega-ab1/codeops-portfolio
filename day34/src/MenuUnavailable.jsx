function MenuUnavailable() {
  return (
    <div className="err">
      <p>The menu couldn't load right now.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>
  );
}

export default MenuUnavailable;
