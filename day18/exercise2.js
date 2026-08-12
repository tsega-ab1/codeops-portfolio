const customer = {
  name: 'Almaz Bekele',
  city: 'Addis Ababa',
  balance: 1500, // ETB
};

for (const [key, value] of Object.entries(customer)) {
  console.log(key, ':', value);
}

