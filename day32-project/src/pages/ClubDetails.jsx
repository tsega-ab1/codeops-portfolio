import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function ClubDetails() {
  const { id } = useParams();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/clubs.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load club details");
        return res.json();
      })
      .then(setClubs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="err">{error}</p>;

  const club = clubs.find((c) => c.id === id);
  if (!club) return <p>No club called {id}.</p>;

  return (
    <div>
      <Link to="/clubs">← Back to clubs</Link>
      <h1>{club.name}</h1>
      <img src={club.image} alt={club.name} />
      <p>{club.description}</p>
      <p><strong>Meets:</strong> {club.meeting}</p>
      <p><strong>Members:</strong> {club.members}</p>
      <p><strong>Interests:</strong> {club.interests.join(", ")}</p>
    </div>
  );
}

export default ClubDetails;
