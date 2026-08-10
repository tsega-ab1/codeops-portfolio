'use strict';

// Step 1 — inputs (form values always arrive as strings)
const billRaw = "480";
const partySize = 4;
const paymentMethod = "telebirr"; // 'telebirr' | 'cbebirr' | 'awash' | other

const bill = Number(billRaw);

// Step 2 — tiered tip: 10% over 300 ETB, otherwise 5%
const tip = bill > 300 ? bill * 0.10 : bill * 0.05;

// Step 5 — service fee depends on payment method
let serviceFee;
switch (paymentMethod) {
    case 'telebirr':
        serviceFee = bill * 0.005;
        break;

    case 'cbebirr':
    case 'awash':
        serviceFee = bill * 0.01;
        break;

    default:
        serviceFee = bill * 0.02;
}

// Step 3 — totals
const total = bill + tip + serviceFee;
const perPerson = total / partySize;

// Step 4 — print with a template literal
console.log(`Bill: ${bill} ETB`);
console.log(`Tip: ${tip} ETB`);
console.log(`Service fee (${paymentMethod}): ${serviceFee} ETB`);
console.log(`Total: ${total} ETB`);
console.log(`Per person: ${perPerson} ETB`);
