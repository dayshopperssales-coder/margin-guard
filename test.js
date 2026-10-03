/* Extracts the REAL num() and compute() from index.html and verifies them against
   independently hand-computed expected values, so the test exercises shipped code. */
const fs = require('fs');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');

// compute() depends on num(), and num() depends on $(). All three are pulled
// straight out of the shipped file.
const numSrc  = html.match(/function num\(id\)\{[^}]*\}/);
const compSrc = html.match(/function compute\(\)\{[\s\S]*?\n  \}/);
if (!numSrc || !compSrc) {
  console.error('FAIL: could not extract num()/compute() from index.html');
  process.exit(1);
}

const inputs = {};
global.document = {
  getElementById: (id) => ({ get value(){ return inputs[id]; }, set value(v){ inputs[id] = v; } })
};
global.$ = global.document.getElementById;

eval(numSrc[0]);
eval(compSrc[0]);

function set(vals) { Object.assign(inputs, vals); }
function money(n){
  const neg = n < 0;
  let s = Math.abs(n).toFixed(2);
  let p = s.split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (neg ? '-$' : '$') + p.join('.');
}

let pass = 0, fail = 0;
function check(name, actual, expected, tol) {
  const ok = Math.abs(actual - expected) <= (tol === undefined ? 0.005 : tol);
  if (ok) { pass++; console.log(`  PASS  ${name}  = ${money(actual)}`); }
  else { fail++; console.log(`  FAIL  ${name}  got ${money(actual)}  expected ${money(expected)}`); }
}

// Case 1: default. Customer pays freight separately.
// revenue 19.99 | goods 6.50 | freight 0 | fee (19.99*3.5% + 0.30) = 0.99965
// contribution 12.49035 | after 5% returns 11.86583 | margin 59.36%
console.log('Case 1: freight passed through, 1 unit, no ads');
set({cost:'6.50', ship:'1.99', shippaid:'1', price:'19.99', qty:'1',
     pct:'3.5', fixed:'0.30', cac:'0', refund:'5'});
let r = compute();
check('revenue',      r.revenue,      19.99);
check('goods',        r.goods,        6.50);
check('freight',      r.freight,      0.00);
check('fee',          r.fee,          0.99965, 0.0001);
check('contribution', r.contribution, 12.49035, 0.0001);
check('afterReturns', r.afterReturns, 11.86583, 0.0001);
check('margin %',     r.margin,       59.3599, 0.01);

// Case 2: identical, seller absorbs freight.
// freight 1.99 | contribution 10.50035 | after 9.97533 | margin 49.90%
console.log('\nCase 2: identical, but freight absorbed by seller');
set({shippaid:'0'});
r = compute();
check('freight',      r.freight,      1.99);
check('contribution', r.contribution, 10.50035, 0.0001);
check('afterReturns', r.afterReturns, 9.97533,  0.0001);
check('margin %',     r.margin,       49.9018, 0.01);

// Case 3: 3 units, freight absorbed. Scaling must be linear.
// revenue 59.97 | goods 19.50 | freight 5.97 | fee 2.39895
// contribution 32.10105 | after 30.49600 | margin 50.85%
console.log('\nCase 3: 3 units, freight absorbed');
set({qty:'3', shippaid:'0'});
r = compute();
check('revenue',      r.revenue,      59.97);
check('goods',        r.goods,        19.50);
check('freight',      r.freight,      5.97);
check('fee',          r.fee,          2.39895, 0.0001);
check('contribution', r.contribution, 32.10105, 0.0001);
check('afterReturns', r.afterReturns, 30.49600, 0.0001);
check('margin %',     r.margin,       50.8520, 0.01);

// Case 4: unprofitable after heavy ad spend. Must go negative.
// contribution = -5.50965 | after = -5.2341675 | margin -26.18%
console.log('\nCase 4: $18 ad cost on a $19.99 product (must be negative)');
set({qty:'1', shippaid:'1', cac:'18'});
r = compute();
check('contribution', r.contribution, -5.50965, 0.0001);
check('afterReturns', r.afterReturns, -5.23417, 0.0001);
check('margin %',     r.margin,       -26.1805, 0.01);
if (r.afterReturns < 0) { pass++; console.log('  PASS  detects loss correctly'); }
else { fail++; console.log('  FAIL  failed to detect a loss'); }

// Case 5: hostile input must not produce NaN.
console.log('\nCase 5: hostile input (empty, negative, non-numeric)');
set({cost:'', ship:'', price:'', qty:'', pct:'', fixed:'', cac:'', refund:'', shippaid:'1'});
r = compute();
const finite = [r.revenue,r.goods,r.freight,r.fee,r.cac,r.contribution,r.afterReturns,r.margin]
  .every(n => Number.isFinite(n));
if (finite) { pass++; console.log('  PASS  no NaN/Infinity on empty input'); }
else { fail++; console.log('  FAIL  produced NaN or Infinity'); }

set({cost:'-50', ship:'-3', price:'-10', qty:'-5', pct:'-2', fixed:'-1', cac:'-7', refund:'-5', shippaid:'0'});
r = compute();
if (Number.isFinite(r.afterReturns) && Number.isFinite(r.margin)) {
  pass++; console.log('  PASS  no NaN/Infinity on negative input');
} else { fail++; console.log('  FAIL  produced NaN or Infinity on negatives'); }

// Case 6: zero revenue must not divide by zero.
set({cost:'6.50', ship:'1.99', price:'0', qty:'1', pct:'3.5', fixed:'0.30', cac:'0', refund:'5', shippaid:'1'});
r = compute();
if (Number.isFinite(r.margin)) { pass++; console.log('  PASS  margin stays finite at zero revenue'); }
else { fail++; console.log('  FAIL  division by zero produced NaN'); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);