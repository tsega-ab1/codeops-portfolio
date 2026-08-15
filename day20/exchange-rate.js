// Day 20 exercise: async function that fetches USD -> ETB rate
// Run with: node exchange-rate.js
// (uses global fetch, available in Node 18+)

async function getUsdToEtbRate() {
  const res = await fetch("https://open.er-api.com/v6/latest/USD");
  if (!res.ok) throw new Error("Could not fetch exchange rate");
  const data = await res.json();
  return data.rates.ETB;
}

getUsdToEtbRate()
  .then(rate => console.log(`1 USD = ${rate} ETB`))
  .catch(err => console.log("Error:", err.message));
