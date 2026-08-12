'use strict';

// subtotal — rest params + reduce callback
function subtotal(...prices) {
  return prices.reduce((sum, p) => sum + p, 0);
}

// discountBy — a factory (higher-order function) returning an arrow
function discountBy(rate) {
  return n => n * (1 - rate);
}

// small pure helpers
function withVat(n) {
  return n * 1.15;
}

function toETB(n) {
  return `${n.toFixed(2)} ETB`;
}

// makeReceiptMaker — closure holding a private, running order number
function makeReceiptMaker() {
  let orderNo = 0; // private state, not reachable from outside
  const memberOff = discountBy(0.10); // 10% member discount, built once

  return function (...items) {
    orderNo++;
    const gross = subtotal(...items);
    const net = withVat(memberOff(gross));
    return `#${orderNo}: ${toETB(net)}`;
  };
}

module.exports = {
  subtotal,
  discountBy,
  withVat,
  toETB,
  makeReceiptMaker,
};
