import assert from "node:assert/strict";
import { cell, toCsv } from "../lib/csv.mjs";

assert.equal(cell("Bole, Kitfo"), '"Bole, Kitfo"');
assert.equal(cell('The "Best" Tibs'), '"The ""Best"" Tibs"');
assert.equal(cell("line1\nline2"), '"line1\nline2"');
assert.equal(cell(null), "");
assert.equal(cell(320), "320");
assert.equal(toCsv([["a", "b,c"], ["1", 'say "hi"']]), 'a,"b,c"\r\n1,"say ""hi"""');
console.log("csv ok");
