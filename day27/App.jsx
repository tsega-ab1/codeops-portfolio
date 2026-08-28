import dishes from "./data.js";
import Menu from "./Menu.jsx";

// Category is hard-coded for now — it becomes clickable once state
// is introduced on Day 28.
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
