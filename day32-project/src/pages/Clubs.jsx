import { useState, useEffect, useMemo } from "react";
import ClubCard from "../components/ClubCard.jsx";

const categories = ["All", "Technology", "Academic", "Arts", "Sports", "Business"];

function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetch("/clubs.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load clubs");
        return res.json();
      })
      .then(setClubs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const shown = useMemo(() => {
    return clubs.filter((c) => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || c.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [clubs, search, category]);

  if (loading) return <p>Loading clubs…</p>;
  if (error) return <p className="err">{error}</p>;

  return (
    <div>
      <h1>Clubs</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clubs…"
      />

      <div className="category-bar">
        {categories.map((cat) => (
          <button
            key={cat}
            className={cat === category ? "chip on" : "chip"}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p>No clubs match your search.</p>
      ) : (
        <div className="card-grid">
          {shown.map((c) => <ClubCard key={c.id} club={c} />)}
        </div>
      )}
    </div>
  );
}

export default Clubs;
