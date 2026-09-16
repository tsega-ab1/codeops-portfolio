import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EventDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/events.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load event details");
        return res.json();
      })
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading…</p>;
  if (error) return <p className="err">{error}</p>;

  const event = events.find((e) => e.id === id);
  if (!event) return <p>No event with id {id}.</p>;

  return (
    <div>
      <button onClick={() => navigate(-1)}>← Back</button>
      <h1>{event.name}</h1>
      <p>{event.date} — {event.location}</p>
      <p>{event.description}</p>
    </div>
  );
}

export default EventDetails;
