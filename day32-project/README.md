# CampusConnect — Student Community Portal

A React-based student community portal built as the Module 3 React Revision Project for the CodeOps Full Stack Software Development program at IBT College Canada.

## Overview

CampusConnect lets students explore campus clubs, upcoming events, and student resources — a small but complete React application built from scratch and organized into reusable components.

## Pages

| Route | Screen |
|---|---|
| `/` | Welcome message, featured events, popular clubs, quick links |
| `/clubs` | Full club list with search and category filtering |
| `/clubs/:id` | Club details — description, meeting info, members, interests |
| `/events` | Upcoming events list |
| `/events/:id` | Full event details, with a back button |
| `/resources` | Student resources by category |
| `/about` | About the application |
| `*` | Custom 404 page with a link home |

## React Concepts Demonstrated

- JSX & components — functional components composed into pages built from reusable pieces (Navbar, Footer, ClubCard, EventCard)
- Props — every card component driven entirely by props, validated with PropTypes
- useState — search text, category filter, event/club data, loading and error state
- Event handling — onClick for filters and favorites, onChange for the search input
- Conditional rendering — loading, error, empty-result, and not-found states throughout
- Rendering lists — map() over clubs and events with stable id keys
- Forms & controlled inputs — the search field is fully controlled by state
- Search/filter functionality — live client-side search combined with category filtering
- useEffect — data fetched from local JSON on mount, with loading and error states shown via early return
- React Router — BrowserRouter, Routes, Route, Link, NavLink, useParams, useNavigate, dynamic routes, and a catch-all 404 route

## Bonus — Context API

Two contexts, each behind its own guarded hook so a missing provider fails immediately with a clear error rather than a silent crash elsewhere:

- FavoritesContext — tracks favorited clubs; ClubCard reads and toggles it directly with no prop drilling from the page down to the card
- ThemeContext — light/dark theme, toggled from the navbar and read anywhere in the tree




Data flow for favorites:

    FavoritesContext
          |
      ClubCard (toggle favorite)
          |
       Clubs page (renders the cards)

## Data

Clubs and events are served from local JSON files in public/ (clubs.json, events.json) and fetched with the native fetch API — no backend required.

## Tech Stack

- React 18 + Vite
- React Router v6
- PropTypes
- Native fetch against local JSON

## Running Locally

    npm install
    npm run dev
