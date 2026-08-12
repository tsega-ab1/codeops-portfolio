const totalByType = (txns, type) =>
  txns
    .filter(t => t.type === type)
    .reduce((sum, { amount }) => sum + amount, 0);

const buildReceipts = txns =>
  txns.map(({ customer, amount, type }) =>
    `${customer}: ${amount} ETB (${type})`
  );

const correctAmount = (txn, newAmount) => ({
  ...txn,
  amount: newAmount,
});

module.exports = { totalByType, buildReceipts, correctAmount };

