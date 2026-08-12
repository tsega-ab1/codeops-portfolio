const prices = [250, 600, 180, 900, 1200, 450];

const withVat = prices.map(p => p * 1.15);
console.log('Prices with VAT:', withVat);

const underThousand = withVat.filter(p => p < 1000);
console.log('Under 1000 ETB:', underThousand);

const grandTotal = underThousand.reduce((sum, p) => sum + p, 0);
console.log('Grand total:', grandTotal, 'ETB');

