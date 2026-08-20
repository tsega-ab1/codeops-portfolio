// ---------------------------------------------------------------
// Bole Weather — live data from Open-Meteo (free, no API key)
// Docs: https://open-meteo.com/en/docs
// ---------------------------------------------------------------

const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_API = "https://geocoding-api.open-meteo.com/v1/search";
const STORAGE_KEY = "boleweather";
const REFRESH_MS = 15 * 60 * 1000; // 15 minutes, per the footer promise

const DEFAULT_CITIES = [
  { name: "Bole, Addis Ababa", country: "Ethiopia", lat: 8.9958, lon: 38.7889 },
  { name: "Dire Dawa", country: "Ethiopia", lat: 9.5931, lon: 41.8661 },
  { name: "Mekelle", country: "Ethiopia", lat: 13.4967, lon: 39.4697 },
  { name: "Hawassa", country: "Ethiopia", lat: 7.0504, lon: 38.4955 },
];

// WMO weather codes -> icon + short label
// https://open-meteo.com/en/docs#weathervariables
const WMO = {
  0: ["☀️", "Clear sky"],
  1: ["🌤️", "Mainly clear"],
  2: ["⛅", "Partly cloudy"],
  3: ["☁️", "Overcast"],
  45: ["🌫️", "Fog"],
  48: ["🌫️", "Depositing fog"],
  51: ["🌦️", "Light drizzle"],
  53: ["🌦️", "Drizzle"],
  55: ["🌧️", "Dense drizzle"],
  56: ["🌧️", "Freezing drizzle"],
  57: ["🌧️", "Freezing drizzle"],
  61: ["🌦️", "Light rain"],
  63: ["🌧️", "Rain"],
  65: ["🌧️", "Heavy rain"],
  66: ["🌧️", "Freezing rain"],
  67: ["🌧️", "Freezing rain"],
  71: ["🌨️", "Light snow"],
  73: ["🌨️", "Snow"],
  75: ["❄️", "Heavy snow"],
  77: ["❄️", "Snow grains"],
  80: ["🌦️", "Rain showers"],
  81: ["🌧️", "Rain showers"],
  82: ["⛈️", "Violent showers"],
  85: ["🌨️", "Snow showers"],
  86: ["❄️", "Heavy snow showers"],
  95: ["⛈️", "Thunderstorm"],
  96: ["⛈️", "Thunderstorm + hail"],
  99: ["⛈️", "Thunderstorm + hail"],
};

function wmo(code) {
  return WMO[code] || ["🌡️", "Unknown"];
}

function uvLabel(uv) {
  if (uv === undefined || uv === null) return "—";
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very High";
  return "Extreme";
}

// ---------------- state ----------------
const state = {
  units: "celsius",       // "celsius" | "fahrenheit"
  theme: "light",
  savedCities: DEFAULT_CITIES.map(c => ({ ...c })),
  activeIndex: 0,
  data: null,              // raw Open-Meteo response for the active city
  lastFetched: null,       // Date
  hourlyExpanded: false,
  weatherByCity: {},       // cache: "lat,lon" -> latest fetch, for saved-city chips
};

// ---------------- DOM refs ----------------
const greetingEl = document.querySelector("#greeting");
const cityNameEl = document.querySelector("#city-name");
const cityDatetimeEl = document.querySelector("#city-datetime");
const heroTempEl = document.querySelector("#hero-temp");
const heroIconEl = document.querySelector("#hero-icon");
const heroConditionEl = document.querySelector("#hero-condition");
const heroFeelsEl = document.querySelector("#hero-feels");
const heroUpdatedEl = document.querySelector("#hero-updated");
const statHumidity = document.querySelector("#stat-humidity");
const statWind = document.querySelector("#stat-wind");
const statPressure = document.querySelector("#stat-pressure");
const statVisibility = document.querySelector("#stat-visibility");
const statUv = document.querySelector("#stat-uv");
const hourlyRow = document.querySelector("#hourly-row");
const hourlyToggle = document.querySelector("#hourly-toggle");
const dailyRow = document.querySelector("#daily-row");
const savedCitiesList = document.querySelector("#saved-cities-list");
const detailsGrid = document.querySelector("#details-grid");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const searchResults = document.querySelector("#search-results");
const footerTz = document.querySelector("#footer-tz");

// ---------------- persistence ----------------
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    units: state.units,
    theme: state.theme,
    savedCities: state.savedCities,
    activeIndex: state.activeIndex,
  }));
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return;
  try {
    const parsed = JSON.parse(saved);
    if (parsed.units) state.units = parsed.units;
    if (parsed.theme) state.theme = parsed.theme;
    if (Array.isArray(parsed.savedCities) && parsed.savedCities.length) {
      state.savedCities = parsed.savedCities;
    }
    if (typeof parsed.activeIndex === "number") state.activeIndex = parsed.activeIndex;
  } catch (err) {
    console.warn("Could not parse saved Bole Weather data", err);
  }
}

// ---------------- fetch ----------------
async function fetchWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,wind_gusts_10m,wind_direction_10m,surface_pressure",
    hourly: "temperature_2m,weather_code,precipitation_probability,visibility,uv_index",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max",
    timezone: "auto",
    forecast_days: "7",
  });
  const res = await fetch(`${FORECAST_API}?${params.toString()}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

async function geocodeCity(name) {
  const params = new URLSearchParams({ name, count: "6", language: "en", format: "json" });
  const res = await fetch(`${GEOCODE_API}?${params.toString()}`);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  return data.results || [];
}

// ---------------- unit helpers ----------------
function c(temp) {
  // API always returns Celsius; convert for display only
  if (temp === undefined || temp === null) return null;
  return state.units === "fahrenheit" ? (temp * 9) / 5 + 32 : temp;
}
function unitLabel() {
  return state.units === "fahrenheit" ? "°F" : "°C";
}
function fmtTemp(temp) {
  const v = c(temp);
  return v === null ? "—" : Math.round(v);
}

// ---------------- load active city ----------------
async function loadActiveCity() {
  const city = state.savedCities[state.activeIndex];
  cityNameEl.textContent = city.name;
  try {
    const data = await fetchWeather(city.lat, city.lon);
    state.data = data;
    state.lastFetched = new Date();
    state.weatherByCity[cityKey(city)] = data;
    render();
  } catch (err) {
    heroConditionEl.textContent = "Could not load live weather.";
  }
}

function cityKey(city) {
  return `${city.lat},${city.lon}`;
}

// ---------------- render ----------------
function render() {
  if (!state.data) return;
  renderGreetingAndHeader();
  renderHero();
  renderHourly();
  renderDaily();
  renderDetails();
  renderSavedCities();
}

function renderGreetingAndHeader() {
  const city = state.savedCities[state.activeIndex];
  const localTime = new Date(state.data.current.time);
  const hour = localTime.getHours();

  let greetText = "Good morning!";
  let icon = "☀️";
  if (hour >= 12 && hour < 17) { greetText = "Good afternoon!"; icon = "🌤️"; }
  else if (hour >= 17 && hour < 21) { greetText = "Good evening!"; icon = "🌇"; }
  else if (hour >= 21 || hour < 5) { greetText = "Good night!"; icon = "🌙"; }
  greetingEl.textContent = `${greetText} ${icon}`;

  cityNameEl.textContent = `${city.name}${city.country && !city.name.includes(city.country) ? ", " + city.country : ""}`;

  const dateStr = localTime.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  const timeStr = localTime.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  cityDatetimeEl.textContent = `${dateStr} • ${timeStr}`;

  footerTz.textContent = state.data.timezone || "local time";
}

function renderHero() {
  const cur = state.data.current;
  const [icon, label] = wmo(cur.weather_code);

  heroTempEl.textContent = fmtTemp(cur.temperature_2m);
  heroIconEl.textContent = icon;
  heroConditionEl.textContent = label;
  heroFeelsEl.textContent = `Feels like ${fmtTemp(cur.apparent_temperature)}${unitLabel()}`;
  heroUpdatedEl.textContent = relativeUpdated();

  statHumidity.textContent = `${Math.round(cur.relative_humidity_2m)}%`;
  statWind.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
  statPressure.textContent = `${Math.round(cur.surface_pressure)} hPa`;

  const nowVis = closestHourlyValue("visibility");
  statVisibility.textContent = nowVis !== null ? `${(nowVis / 1000).toFixed(0)} km` : "—";

  const nowUv = closestHourlyValue("uv_index");
  statUv.textContent = nowUv !== null ? `${nowUv.toFixed(0)} · ${uvLabel(nowUv)}` : "—";
}

function relativeUpdated() {
  if (!state.lastFetched) return "Updated just now";
  const mins = Math.round((Date.now() - state.lastFetched.getTime()) / 60000);
  if (mins < 1) return "Updated just now";
  if (mins === 1) return "Updated 1 min ago";
  return `Updated ${mins} min ago`;
}

function closestHourlyValue(field) {
  const hourly = state.data.hourly;
  if (!hourly || !hourly.time) return null;
  const nowIso = state.data.current.time;
  let idx = hourly.time.findIndex(t => t >= nowIso);
  if (idx === -1) idx = 0;
  const val = hourly[field] ? hourly[field][idx] : null;
  return val === undefined ? null : val;
}

function renderHourly() {
  const hourly = state.data.hourly;
  const nowIso = state.data.current.time;
  let startIdx = hourly.time.findIndex(t => t >= nowIso);
  if (startIdx === -1) startIdx = 0;

  const count = state.hourlyExpanded ? 24 : 9;
  const slice = hourly.time.slice(startIdx, startIdx + count);

  hourlyRow.innerHTML = slice.map((iso, i) => {
    const realIdx = startIdx + i;
    const [icon] = wmo(hourly.weather_code[realIdx]);
    const date = new Date(iso);
    const label = i === 0 ? "Now" : date.toLocaleTimeString(undefined, { hour: "numeric" });
    return `
      <div class="hour-chip ${i === 0 ? "now" : ""}">
        <p class="h-label">${label}</p>
        <span class="h-icon">${icon}</span>
        <p class="h-temp">${fmtTemp(hourly.temperature_2m[realIdx])}${unitLabel()}</p>
      </div>
    `;
  }).join("");
}

function renderDaily() {
  const daily = state.data.daily;
  dailyRow.innerHTML = daily.time.map((iso, i) => {
    const [icon] = wmo(daily.weather_code[i]);
    const date = new Date(iso + "T00:00:00");
    const dayName = i === 0 ? "Today" : date.toLocaleDateString(undefined, { weekday: "short" });
    const dateLabel = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    return `
      <div class="day-chip">
        <p class="d-name">${dayName}</p>
        <p class="d-date">${dateLabel}</p>
        <span class="d-icon">${icon}</span>
        <p class="d-max">${fmtTemp(daily.temperature_2m_max[i])}°</p>
        <p class="d-min">${fmtTemp(daily.temperature_2m_min[i])}°</p>
      </div>
    `;
  }).join("");
}

function renderDetails() {
  const daily = state.data.daily;
  const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  const items = [
    ["🌅", "Sunrise", sunrise],
    ["🌇", "Sunset", sunset],
    ["☔", "Chance of Rain", `${Math.round(daily.precipitation_probability_max[0] ?? 0)}%`],
    ["🌡️", "Max Temp", `${fmtTemp(daily.temperature_2m_max[0])}${unitLabel()}`],
    ["🌡️", "Min Temp", `${fmtTemp(daily.temperature_2m_min[0])}${unitLabel()}`],
    ["🌬️", "Wind Gust", `${Math.round(daily.wind_gusts_10m_max[0] ?? 0)} km/h`],
  ];

  detailsGrid.innerHTML = items.map(([icon, label, value]) => `
    <div class="detail-item">
      <span class="detail-icon">${icon}</span>
      <div><p class="detail-label">${label}</p><p class="detail-value">${value}</p></div>
    </div>
  `).join("");
}

function renderSavedCities() {
  savedCitiesList.innerHTML = state.savedCities.map((city, i) => {
    const cached = state.weatherByCity[cityKey(city)];
    let icon = "⛅", tempStr = "—", cond = "Loading…";
    if (cached) {
      const [ic, label] = wmo(cached.current.weather_code);
      icon = ic;
      cond = label;
      tempStr = `${fmtTemp(cached.current.temperature_2m)}${unitLabel()}`;
    }
    const active = i === state.activeIndex;
    return `
      <li class="saved-city ${active ? "active" : ""}" data-index="${i}">
        <div class="saved-city-left">
          <span class="saved-city-icon">${icon}</span>
          <div>
            <p class="saved-city-name">${city.name}</p>
            <p class="saved-city-cond">${cond}</p>
          </div>
        </div>
        <div class="saved-city-right">
          <span class="saved-city-temp">${tempStr}</span>
          <button class="star-btn active" data-remove="${i}" title="Remove from saved" ${state.savedCities.length <= 1 ? "disabled" : ""}>★</button>
        </div>
      </li>
    `;
  }).join("");

  // background-fetch the others so their chips fill in
  state.savedCities.forEach((city, i) => {
    if (i === state.activeIndex) return;
    if (state.weatherByCity[cityKey(city)]) return;
    fetchWeather(city.lat, city.lon)
      .then(data => {
        state.weatherByCity[cityKey(city)] = data;
        renderSavedCities();
      })
      .catch(() => {});
  });
}

// ---------------- events ----------------
document.querySelectorAll(".unit-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.units = btn.dataset.unit;
    document.querySelectorAll(".unit-btn").forEach(b => b.classList.toggle("active", b === btn));
    save();
    render();
  });
});

document.querySelectorAll(".theme-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    state.theme = btn.dataset.theme;
    document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b === btn));
    applyTheme();
    save();
  });
});

function applyTheme() {
  if (state.theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

hourlyToggle.addEventListener("click", () => {
  state.hourlyExpanded = !state.hourlyExpanded;
  hourlyToggle.textContent = state.hourlyExpanded ? "Show fewer hours" : "View full hourly";
  renderHourly();
});

savedCitiesList.addEventListener("click", (e) => {
  const removeBtn = e.target.closest("[data-remove]");
  if (removeBtn) {
    const idx = Number(removeBtn.dataset.remove);
    if (state.savedCities.length <= 1) return;
    state.savedCities.splice(idx, 1);
    if (state.activeIndex >= state.savedCities.length) state.activeIndex = state.savedCities.length - 1;
    else if (state.activeIndex > idx) state.activeIndex--;
    save();
    renderSavedCities();
    loadActiveCity();
    return;
  }
  const li = e.target.closest(".saved-city");
  if (!li) return;
  state.activeIndex = Number(li.dataset.index);
  save();
  loadActiveCity();
});

searchForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = searchInput.value.trim();
  if (!q) return;
  searchResults.innerHTML = `<li class="search-empty">Searching…</li>`;
  try {
    const results = await geocodeCity(q);
    if (results.length === 0) {
      searchResults.innerHTML = `<li class="search-empty">No cities found.</li>`;
      return;
    }
    searchResults.innerHTML = results.map((r, i) => `
      <li data-idx="${i}">
        <span>${r.name}${r.admin1 ? ", " + r.admin1 : ""}</span>
        <span class="r-sub">${r.country || ""}</span>
      </li>
    `).join("");
    searchResults.dataset.raw = JSON.stringify(results);
  } catch (err) {
    searchResults.innerHTML = `<li class="search-empty">Search failed. Try again.</li>`;
  }
});

searchResults.addEventListener("click", (e) => {
  const li = e.target.closest("li[data-idx]");
  if (!li) return;
  const results = JSON.parse(searchResults.dataset.raw || "[]");
  const r = results[Number(li.dataset.idx)];
  if (!r) return;

  const city = {
    name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
    country: r.country || "",
    lat: r.latitude,
    lon: r.longitude,
  };

  const existingIdx = state.savedCities.findIndex(c => c.lat === city.lat && c.lon === city.lon);
  if (existingIdx === -1) {
    state.savedCities.push(city);
    state.activeIndex = state.savedCities.length - 1;
  } else {
    state.activeIndex = existingIdx;
  }

  searchInput.value = "";
  searchResults.innerHTML = "";
  save();
  renderSavedCities();
  loadActiveCity();
});

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
  });
});

// ---------------- init ----------------
function tickUpdatedLabel() {
  if (state.data) heroUpdatedEl.textContent = relativeUpdated();
}

async function init() {
  load();
  applyTheme();
  document.querySelectorAll(".unit-btn").forEach(b => b.classList.toggle("active", b.dataset.unit === state.units));
  document.querySelectorAll(".theme-btn").forEach(b => b.classList.toggle("active", b.dataset.theme === state.theme));

  await loadActiveCity();

  setInterval(loadActiveCity, REFRESH_MS);
  setInterval(tickUpdatedLabel, 30 * 1000);
}

init();
