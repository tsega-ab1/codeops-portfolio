const VAT = 0.15;

function addVat(amount) {
  return amount * (1 + VAT);
}

module.exports = { VAT, addVat };

