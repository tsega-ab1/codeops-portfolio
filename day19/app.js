const form = document.querySelector("#add-form");
const name = document.querySelector("#name");
const price = document.querySelector("#price");
const list = document.querySelector("#list");
const totalEl = document.querySelector("#total");
const countEl = document.querySelector("#count");
const clearBtn = document.querySelector("#clear-bought");

function addRow(itemName, itemPrice) {
  const li = document.createElement("li");
  li.dataset.id = Date.now();
  li.dataset.price = itemPrice;

  const span = document.createElement("span");
  span.textContent = `${itemName} — ${itemPrice} ETB`;

  const editBtn = document.createElement("button");
  editBtn.textContent = "edit";
  editBtn.className = "edit";

  const delBtn = document.createElement("button");
  delBtn.textContent = "x";
  delBtn.className = "del";

  li.append(span, editBtn, delBtn);
  list.append(li);
}

function updateStats() {
  const rows = [...list.querySelectorAll("li")];
  countEl.textContent = `${rows.length} items`;

  const total = rows
    .filter(li => !li.classList.contains("bought"))
    .reduce((sum, li) => sum + Number(li.dataset.price), 0);
  totalEl.textContent = total;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const n = name.value.trim();
  const p = Number(price.value);
  if (!n || !p) return;
  addRow(n, p);
  form.reset();
  updateStats();
});

list.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  if (e.target.matches(".del")) {
    li.remove();
    updateStats();
    return;
  }

  if (e.target.matches(".edit")) {
    const span = li.querySelector("span");
    const currentName = span.textContent.split(" — ")[0];
    const newName = prompt("Item name:", currentName) ?? currentName;
    const newPrice = Number(prompt("Price (ETB):", li.dataset.price)) || Number(li.dataset.price);
    li.dataset.price = newPrice;
    span.textContent = `${newName} — ${newPrice} ETB`;
    updateStats();
    return;
  }

  // clicking the row itself (not a button) toggles bought
  li.classList.toggle("bought");
  updateStats();
});

clearBtn.addEventListener("click", () => {
  list.querySelectorAll("li.bought").forEach(li => li.remove());
  updateStats();
});

updateStats(); // initial 0 items

// Day 20 homework: seed the list from a local JSON file on load
async function loadStarterItems() {
  try {
    const res = await fetch("./starter-items.json");
    if (!res.ok) throw new Error("Could not load starter items");
    const items = await res.json();
    items.forEach(it => addRow(it.name, it.price));
    updateStats();
  } catch (err) {
    console.log(err.message); // non-fatal — list just starts empty
  }
}

loadStarterItems();
