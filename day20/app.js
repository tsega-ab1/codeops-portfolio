const form = document.querySelector("#search-form");
const input = document.querySelector("#country");
const out = document.querySelector("#facts");
const retryBtn = document.querySelector("#retry");

let lastQuery = "ethiopia";

function renderCountry(c) {
  out.innerHTML = "";

  const flag = document.createElement("img");
  flag.src = c.flags.svg;
  flag.alt = `Flag of ${c.name.common}`;

  const title = document.createElement("h2");
  title.textContent = c.name.common;

  const capital = document.createElement("p");
  capital.textContent = `Capital: ${c.capital ? c.capital[0] : "N/A"}`;

  const population = document.createElement("p");
  population.textContent = `Population: ${c.population.toLocaleString()}`;

  const region = document.createElement("p");
  region.textContent = `Region: ${c.region}`;

  const currencies = document.createElement("p");
  const currencyNames = c.currencies
    ? Object.values(c.currencies).map(cur => cur.name).join(", ")
    : "N/A";
  currencies.textContent = `Currencies: ${currencyNames}`;

  out.append(flag, title, capital, population, region, currencies);
}

async function showCountry(name) {
  lastQuery = name;
  retryBtn.hidden = true;
  out.innerHTML = `<p class="loading">Loading…</p>`;

  try {
    const res = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error("Country not found");
    const [country] = await res.json();
    renderCountry(country);
  } catch (err) {
    out.innerHTML = `<p class="error">${err.message}</p>`;
    retryBtn.hidden = false;
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = input.value.trim();
  if (name) showCountry(name);
});

retryBtn.addEventListener("click", () => showCountry(lastQuery));

showCountry("ethiopia"); // default on load
