const customer = {
  name: 'Almaz Bekele',
  city: 'Addis Ababa',
  balance: 1500,
};

const updatedCustomer = {
  ...customer,
  city: 'Bahir Dar',
  phone: '0911223344',
};

console.log('Original:', customer);
console.log('Updated:', updatedCustomer);
console.log('Original still unchanged:', customer.city === 'Addis Ababa');

