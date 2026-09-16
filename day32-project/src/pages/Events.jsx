import { useState, useEffect } from "react";
import EventCard from "../components/EventCard.jsx";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/events.json")
      .then((res) => {
        if (!res.ok) throw new Error("Could not load events");
        return res.json();
      })
      .then(setEvents)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading events…</p>;
  if (error) return <p className="err">{error}</p>;
  if (events.length === 0) return <p>No upcoming events.</p>;

  return (
    <div>
      <h1>Upcoming Events</h1>
      <div className="card-grid">
        {events.map((e) => <EventCard key={e.id} event={e} />)}
      </div>
    </div>
  );
}

export default Events;
