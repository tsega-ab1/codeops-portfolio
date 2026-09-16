import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { useFavorites } from "../context/useFavorites.js";

function ClubCard({ club }) {
  const { favoriteClubs, toggleFavorite } = useFavorites();
  const isFavorite = favoriteClubs.includes(club.id);

  return (
    <div className="card">
      <img src={club.image} alt={club.name} />
      <h3>{club.name}</h3>
      <p>{club.description}</p>
      <p className="category">{club.category}</p>
      <button onClick={() => toggleFavorite(club.id)}>
        {isFavorite ? "★ Favorited" : "☆ Favorite"}
      </button>
      <Link to={`/clubs/${club.id}`}>View details</Link>
    </div>
  );
}

ClubCard.propTypes = {
  club: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
  }).isRequired,
};

export default ClubCard;
