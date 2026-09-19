import { Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h2>Today's Specials</h2>
      <p>Fresh Doro Wat, Kitfo, and Shiro — hot from the kitchen.</p>
      <Link to="/menu">See the full menu</Link>
    </div>
  );
}

export default Home;
