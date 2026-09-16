import PropTypes from "prop-types";
import { Link } from "react-router-dom";

function EventCard({ event }) {
  return (
    <div className="card">
      <h3>{event.name}</h3>
      <p>{event.date} — {event.location}</p>
      <p>{event.description}</p>
      <Link to={`/events/${event.id}`}>View details</Link>
    </div>
  );
}

EventCard.propTypes = {
  event: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
  }).isRequired,
};

export default EventCard;
