export const totalByType = (txns, type) =>
  txns
    .filter(t => t.type === type)
    .reduce((sum, { amount }) => sum + amount, 0);

export const buildReceipts = txns =>
  txns.map(({ customer, amount, type }) =>
    `${customer}: ${amount} ETB (${type})`
  );

export const correctAmount = (txn, newAmount) => ({
  ...txn,
  amount: newAmount,
});

