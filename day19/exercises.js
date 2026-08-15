// Exercise 1 — select h1, change text, toggle class
const title = document.querySelector("#title");
const highlightBtn = document.querySelector("#highlight-btn");

title.textContent = "DOM & Events Warmup — updated!";
highlightBtn.addEventListener("click", () => {
  title.classList.toggle("highlight");
});

// Exercise 2 — array of cities -> createElement -> append
const cities = ["Addis Ababa", "Bahir Dar", "Hawassa"];
const citiesList = document.querySelector("#cities");

cities.forEach(city => {
  const li = document.createElement("li");
  li.textContent = city;
  citiesList.append(li);
});

// Exercise 3 — bubbling: click on inner button, listener on both button and outer div
const innerBtn = document.querySelector("#inner-btn");
const outerDiv = document.querySelector("#outer");

innerBtn.addEventListener("click", (e) => {
  console.log("inner button clicked, event.target:", e.target);
});

outerDiv.addEventListener("click", (e) => {
  console.log("outer div heard a click, event.target:", e.target);
  // event.target is still the button even though the listener is on the div —
  // this is bubbling: the click event travels up from where it happened.
});

// Exercise 4 — delegated delete listener
const deleteList = document.querySelector("#delete-list");

deleteList.addEventListener("click", (e) => {
  if (e.target.matches(".del")) {
    e.target.closest("li").remove();
  }
});

// Exercise 5 — form add, preventDefault, clear field
const addForm = document.querySelector("#add-form");
const addInput = document.querySelector("#add-input");
const addList = document.querySelector("#add-list");

addForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const value = addInput.value.trim();
  if (!value) return;

  const li = document.createElement("li");
  li.textContent = value;
  addList.append(li);

  addInput.value = "";
});
