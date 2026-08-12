'use strict';

const { makeReceiptMaker } = require('./order');

const receipt = makeReceiptMaker();

// Almaz orders Doro Wat (220) + Tibs (180) + Shiro (120)
console.log(receipt(220, 180, 120));

// Dawit orders Firfir (140) + Buna (60)
console.log(receipt(140, 60));
