import Header from "./Header.jsx";
import Dish from "./Dish.jsx";

const menu = [
  { id: 1, name: "Doro Wat", price: 240 },
  { id: 2, name: "Shiro", price: 120 },
  { id: 3, name: "Tibs", price: 280 },
];

function App() {
  return (
    <div>
      <Header />
      <div className="menu">
        {menu.map((dish) => (
          <Dish key={dish.id} name={dish.name} price={dish.price} />
        ))}
      </div>
    </div>
  );
}

export default App;
