const form = document.querySelector("#signup");
const nameInput = document.querySelector("#name");
const phoneInput = document.querySelector("#phone");
const msg = document.querySelector("#msg");
const list = document.querySelector("#list");
const countEl = document.querySelector("#count");

const PHONE = /^(?:\+251|0)9\d{8}$/;

// --- safe load/save (Part 1 + 2: storage + JSON, guarded) ---
function loadSignups() {
  try {
    const raw = localStorage.getItem("signups");
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return []; // corrupt data -> start fresh
  }
}

function saveSignups(signups) {
  localStorage.setItem("signups", JSON.stringify(signups));
}

// --- render ---
function renderSignups(signups) {
  list.innerHTML = "";
  signups.forEach(s => {
    const li = document.createElement("li");
    li.textContent = `${s.name} — ${s.phone}`; // textContent, never innerHTML
    list.append(li);
  });
  countEl.textContent = `${signups.length} people have signed up.`;
}

// --- validation (Part 3 + 4) ---
function validate(name, phone) {
  if (!name) return "Please enter your name.";
  if (name.length < 2) return "Name is too short.";
  if (!phone) return "Phone is required.";
  if (!PHONE.test(phone)) return "Enter a valid Ethiopian phone (09... or +2519...).";
  return "";
}

// --- init: restore on load ---
let signups = loadSignups();
renderSignups(signups);

// --- submit ---
form.addEventListener("submit", (e) => {
  e.preventDefault();
  msg.textContent = "";

  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  const error = validate(name, phone);
  if (error) {
    msg.textContent = error;
    return;
  }

  signups.push({ name, phone });
  saveSignups(signups);
  renderSignups(signups);
  form.reset();
});

// Day 21 homework — persist a theme preference
const themeToggle = document.querySelector("#theme-toggle");

const savedTheme = localStorage.getItem("theme");
if (savedTheme === "dark") document.body.classList.add("dark");

themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  const theme = document.body.classList.contains("dark") ? "dark" : "light";
  localStorage.setItem("theme", theme);
});
