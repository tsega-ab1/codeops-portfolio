const { VAT, addVat } = require('./money');

console.log('VAT rate:', VAT);
console.log('480 ETB with VAT:', addVat(480), 'ETB');

