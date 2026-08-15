const form = document.querySelector("#add-form");
const name = document.querySelector("#name");
const price = document.querySelector("#price");
const list = document.querySelector("#list");
const totalEl = document.querySelector("#total");

function addRow(itemName, itemPrice) {
  const li = document.createElement("li");
  li.dataset.price = itemPrice;

  const span = document.createElement("span");
  span.textContent = `${itemName} — ${itemPrice} ETB`;

  const delBtn = document.createElement("button");
  delBtn.textContent = "x";
  delBtn.className = "del";

  li.append(span, delBtn);
  list.append(li);
}

function updateTotal() {
  const items = [...list.querySelectorAll("li:not(.bought)")];
  const total = items.reduce((sum, li) => sum + Number(li.dataset.price), 0);
  totalEl.textContent = total;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const n = name.value.trim();
  const p = Number(price.value);
  if (!n || !p) return;
  addRow(n, p);
  form.reset();
  updateTotal();
});

list.addEventListener("click", (e) => {
  if (e.target.matches(".del")) {
    e.target.closest("li").remove();
    updateTotal();
  } else if (e.target.closest("li")) {
    e.target.closest("li").classList.toggle("bought");
    updateTotal();
  }
});
