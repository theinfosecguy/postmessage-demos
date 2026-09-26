import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

// Exercise the actual formatter without requiring the demo's DOM scaffolding.
const source = readFileSync(new URL('../public/host.js', import.meta.url), 'utf8');
const context = vm.createContext({});
vm.runInContext(source.slice(source.indexOf('const PRINT_DEPTH'), source.indexOf('\nfunction log(')), context);

const cases = [
  ['invalid Date', 'new Date(NaN)', 'Invalid Date'],
  ['nested invalid Date', '({type:"resize",height:350,extra:new Date(NaN)})', /Invalid Date/],
  ['valid Date', 'new Date("2026-01-01T00:00:00Z")', '2026-01-01T00:00:00.000Z'],
  ['BigInt', '350n', '350n'],
  ['cycle', '(()=>{const d={height:350};d.self=d;return d})()', /\[circular\]/],
  ['repeated reference', '(()=>{const d={height:350};return [d,d]})()', '[{"height": 350}, {"height": 350}]'],
  ['Map', 'new Map([["a",1]])', 'Map(1)'],
  ['Set', 'new Set([1,2])', 'Set(2)'],
  ['null', 'null', 'null'],
  ['undefined', 'undefined', 'undefined'],
  ['NaN', 'NaN', 'NaN'],
  ['Infinity', 'Infinity', 'Infinity'],
  ['deep object', '(()=>{let d={},root=d;for(let i=0;i<100;i++){d.next={};d=d.next}return root})()', /\{…\}/],
  ['wide object', 'Object.fromEntries(Array.from({length:100},(_,i)=>["key"+i,i]))', /88 more/],
  ['long string', '"x".repeat(1000000)', /chars\)$/],
];
for (const [name, expression, expected] of cases) {
  test(name, () => {
    const text = vm.runInContext(`print(${expression})`, context);
    if (expected instanceof RegExp) assert.match(text, expected);
    else assert.equal(text, expected);
    assert.ok(text.length < 650, 'log preview stays bounded');
  });
}
test('structured clone preserves an invalid Date', () => {
  assert.ok(Number.isNaN(structuredClone(new Date(NaN)).getTime()));
});
