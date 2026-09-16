import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import EventCard from "../components/EventCard.jsx";
import ClubCard from "../components/ClubCard.jsx";

function Home() {
  const [events, setEvents] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/events.json").then((r) => r.json()),
      fetch("/clubs.json").then((r) => r.json()),
    ])
      .then(([eventData, clubData]) => {
        setEvents(eventData.slice(0, 2));
        setClubs(clubData.slice(0, 2));
      })
      .catch(() => setError("Could not load campus data"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Welcome to CampusConnect</h1>
      <p>Your hub for clubs, events, and student resources.</p>

      <div className="quick-links">
        <Link to="/clubs">Browse Clubs</Link>
        <Link to="/events">See Events</Link>
        <Link to="/resources">Find Resources</Link>
      </div>

      {loading && <p>Loading campus highlights…</p>}
      {error && <p className="err">{error}</p>}

      {!loading && !error && (
        <>
          <h2>Featured Events</h2>
          <div className="card-grid">
            {events.map((e) => <EventCard key={e.id} event={e} />)}
          </div>

          <h2>Popular Clubs</h2>
          <div className="card-grid">
            {clubs.map((c) => <ClubCard key={c.id} club={c} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
