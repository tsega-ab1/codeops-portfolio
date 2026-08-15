// Day 21 homework — regex drills
// Run with: node regex-drills.js

const PIN = /^\d{4}$/;
const AMOUNT = /^\d+(\.\d{1,2})?$/;   // TeleBirr amount, e.g. 250 or 250.50
const EMAIL = /^[\w.]+@[\w.]+\.\w+$/;

console.log("PIN tests");
console.log(PIN.test("1234"));   // true
console.log(PIN.test("12a4"));   // false
console.log(PIN.test("123"));    // false

console.log("Amount tests");
console.log(AMOUNT.test("250"));      // true
console.log(AMOUNT.test("250.50"));   // true
console.log(AMOUNT.test("250.5"));    // true
console.log(AMOUNT.test("250.555"));  // false
console.log(AMOUNT.test("abc"));      // false

console.log("Email tests");
console.log(EMAIL.test("almaz@example.et"));  // true
console.log(EMAIL.test("almaz@example"));     // false
console.log(EMAIL.test("almaz.example.et"));  // false
