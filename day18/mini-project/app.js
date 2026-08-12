import { transactions } from './transactions.js';
import { totalByType, buildReceipts, correctAmount } from './report.js';

console.log('=== TeleBirr Transaction Report ===\n');

const totalCredits = totalByType(transactions, 'credit');
const totalDebits = totalByType(transactions, 'debit');
console.log(`Total credits: ${totalCredits} ETB`);
console.log(`Total debits: ${totalDebits} ETB\n`);

console.log('Receipts:');
buildReceipts(transactions).forEach(line => console.log(' -', line));

console.log('\n--- Correcting transaction #1 ---');
const original = transactions[0];
const corrected = correctAmount(original, 300);

console.log('Original (unchanged):', original);
console.log('Corrected copy:', corrected);

