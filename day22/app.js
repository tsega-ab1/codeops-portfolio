const state = {
  base: "ETB",
  rates: {},
  watchlist: [],
  amount: 100,
  currency: "USD",
};

const API = "https://open.er-api.com/v6/latest/ETB";

const status = document.querySelector("#status");
const select = document.querySelector("#currency");

async function loadRates() {
  status.textContent = "Loading rates…";

  try {
    const res = await fetch(API);

    if (!res.ok) {
      throw new Error("HTTP " + res.status);
    }

    const data = await res.json();

    state.rates = data.rates;

    status.textContent = "";

    render();
  } catch (err) {
    status.textContent = "Could not load rates.";
  }
}

function render() {
  // fill the dropdown from the live rates
  const codes = Object.keys(state.rates);

  select.innerHTML = codes.map((c) => `<option>${c}</option>`).join("");

  select.value = state.currency;

  renderWatchlist();
}

// convert
const form = document.querySelector("#convert-form");
const amount = document.querySelector("#amount");
const result = document.querySelector("#result");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const amt = Number(amount.value);

  if (!amt || amt <= 0) {
    result.textContent = "Enter a valid amount.";
    return;
  }

  state.amount = amt;
  state.currency = select.value;

  const rate = state.rates[state.currency];
  const out = (amt * rate).toFixed(2);

  result.textContent = `${amt} ETB = ${out} ${state.currency}`;

  save();
  render();
});

// add to watchlist
const addBtn = document.querySelector("#watch");

addBtn.addEventListener("click", () => {
  const c = select.value;

  // no duplicates
  if (state.watchlist.includes(c)) return;

  state.watchlist.push(c);

  save();
  renderWatchlist();
});

// render + remove
const watchUl = document.querySelector("#watchlist");

function renderWatchlist() {
  if (state.watchlist.length === 0) {
    watchUl.innerHTML = "<li>No currencies yet</li>";
    return;
  }

  watchUl.innerHTML = state.watchlist
    .map((c) => {
      const r = state.rates[c];

      return `<li data-c="${c}">
            1 ETB = ${r} ${c}
            <button class="rm">×</button>
        </li>`;
    })
    .join("");
}

watchUl.addEventListener("click", (e) => {
  if (!e.target.matches(".rm")) return;

  const c = e.target.closest("li").dataset.c;

  state.watchlist = state.watchlist.filter((x) => x !== c);

  save();
  renderWatchlist();
});

// save
const KEY = "birrwatch";

function save() {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      watchlist: state.watchlist,
      currency: state.currency,
    }),
  );
}

// load
function load() {
  const saved = localStorage.getItem(KEY);

  if (saved) {
    try {
      Object.assign(state, JSON.parse(saved));
    } catch (err) {
      // ignore corrupt saved data
    }
  }
}

// startup
async function init() {
  load();
  await loadRates();
  render();
}

init();
