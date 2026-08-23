# Bole Weather

A weather dashboard for Ethiopian cities, pulling **live, real forecast data** from
[Open-Meteo](https://open-meteo.com) — a free weather API that needs no API key and
no sign-up.

## Live data, not mock data

Every number on screen — current temperature, humidity, wind, pressure, visibility,
UV index, the hourly strip, and the 7-day forecast — comes straight from Open-Meteo's
`forecast` endpoint at load time and refreshes automatically every 15 minutes:

```
https://api.open-meteo.com/v1/forecast
  ?latitude=...&longitude=...
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,...
  &hourly=temperature_2m,weather_code,precipitation_probability,visibility,uv_index
  &daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,...
  &timezone=auto
```

City search uses Open-Meteo's free geocoding endpoint, so you can search **any** city
worldwide, not just the four pre-loaded Ethiopian ones:

```
https://geocoding-api.open-meteo.com/v1/search?name=<query>
```

No API key, no billing, no rate-limit headaches for a project like this.

## Features

- Live current conditions: temperature, feels-like, condition, humidity, wind, pressure, visibility, UV index
- Hourly forecast (9 hours by default, expandable to 24)
- 7-day forecast
- °C / °F toggle
- Light / dark theme toggle
- City search (worldwide, via geocoding) — search results can be added to Saved Cities
- Saved Cities panel with live conditions for each, click to switch, star to remove
- Auto-refresh every 15 minutes + a live "Updated X min ago" indicator
- All persisted to `localStorage` (units, theme, saved cities, active city)

## Run it

Just open `index.html` in a browser — no build step, no server required, since
Open-Meteo's API allows direct browser requests (CORS-enabled).

## Data source

[open-meteo.com](https://open-meteo.com) — free for non-commercial use, no API key,
sourced from national weather services (ECMWF, NOAA, DWD, and others).


🎥 **Loom Project Demo:** [Watch the Project Demo](https://www.loom.com/share/fd6eb0e580f04777963fefb1c54a8437)

🌐 **Live Hosted Application:** [View Bole Weather](https://tsega-ab1.github.io/codeops-portfolio/)




