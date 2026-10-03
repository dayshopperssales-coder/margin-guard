# Dropship Margin Guard

Free, single-file dropshipping profit calculator. No build step, no dependencies, no backend, no analytics. It answers one question honestly:

> After real supplier cost, real freight and real selling fees — does this order actually make money?

Live at https://dayshopperssales-coder.github.io/margin-guard/

## The problem it solves

Two errors account for most of the quietly-losing dropshipping stores:

1. **Treating the supplier's suggested retail as your cost.** Suppliers display a strikethrough "compare at" price that is routinely ~2x the real price. Feed that into a margin tool and every product looks dangerously thin when it is not.
2. **Folding freight into the product price.** Padding the price to "cover shipping" hides per-order economics and inflates ad cost, because every extra dollar of price also pays payment fees.

This calculator separates them and shows the real number either way.

## Usage

Open `index.html`. Nothing to install, no server needed.

## Verification

The arithmetic is tested against hand-computed values, including loss detection and hostile input:

```
$ node test.js
25 passed, 0 failed
```

`test.js` extracts the real `num()` and `compute()` functions out of `index.html` and executes them, so the test exercises shipped code rather than a copy of it. Covered: freight passed through vs absorbed, multi-unit scaling, a deliberately unprofitable scenario, empty/negative/non-numeric input, and division-by-zero at zero revenue.

## What it does not do

- No tax, duty or IOSS modelling. In the US marketplace these generally fall on the buyer.
- Returns are a flat percentage haircut on contribution. That is a floor, not a forecast, since a returned unit usually returns some cost with it.
- Single-order only. It does not model multi-order shipping consolidation.

## Licence

MIT. Use it, fork it, embed it.