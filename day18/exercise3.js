const customer = {
  name: 'Almaz Bekele',
  city: 'Addis Ababa',
  balance: 1500,
};

// one-line destructuring
const { name, city } = customer;
console.log(`${name} lives in ${city}`);

// parameter destructuring
function greet({ name }) {
  return `Selam ${name}`;
}

console.log(greet(customer));

