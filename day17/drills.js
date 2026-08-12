'use strict';

// ---- Closure drill 1: makeCounter ----
// Each call to makeCounter() creates an independent counter with
// its own private `count`, hidden from outside code.
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}

const counterA = makeCounter();
const counterB = makeCounter();

console.log(counterA()); // 1
console.log(counterA()); // 2
console.log(counterB()); // 1 — independent from counterA

// ---- Closure drill 2: once ----
// Wraps a function so it can only ever run a single time —
// useful for guarding against a double-tapped "Pay" button.
function once(fn) {
  let called = false;
  return function (...args) {
    if (called) return;
    called = true;
    return fn(...args);
  };
}

function submitPayment(amount) {
  console.log(`Payment submitted: ${amount} ETB`);
}

const pay = once(submitPayment);
pay(480); // runs
pay(480); // ignored — already called

// ---- Callback drill 1: forEach ----
// Reimplements array.forEach using a plain for...of loop and a callback.
function forEach(items, action) {
  for (const item of items) {
    action(item);
  }
}

forEach([120, 200, 160], price => {
  console.log(`${price} ETB`);
});

// ---- Callback drill 2: map ----
// Reimplements array.map: builds and returns a new array, one
// transformed item at a time.
function map(items, transform) {
  const result = [];
  for (const item of items) {
    result.push(transform(item));
  }
  return result;
}

const withVatAll = map([120, 200, 160], price => price * 1.15);
console.log(withVatAll); // [138, 230, 184]
