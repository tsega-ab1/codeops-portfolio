import dishes from "./data.js";
import Menu from "./Menu.jsx";

function App() {
  const category = "Main";

  return (
    <div>
      <h1>Addis Eats</h1>
      <h2>{category}</h2>
      <Menu dishes={dishes} category={category} />
    </div>
  );
}

export default App;
