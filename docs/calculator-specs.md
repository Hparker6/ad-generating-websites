# Calculator specs

Every calculator is specified here before it's built: formula (with an
authoritative source), inputs, outputs, and the test cases its unit tests
must pass. Benchmarks or fees shown on a page must cite their source here too.

---

## Profit Margin Calculator — `/profit-margin-calculator`

**Search intent:** "profit margin calculator", "gross margin calculator",
"net profit margin", "operating margin calculator". Distinct from
`/markup-vs-margin` (which compares markup and margin for one price) — this
one works from revenue and cost lines to the three standard margins.

**Formulas** (Corporate Finance Institute; AccountingTools):

```
gross profit       = revenue − cost of goods sold (COGS)
gross margin %     = gross profit ÷ revenue × 100
operating profit   = gross profit − operating expenses
operating margin % = operating profit ÷ revenue × 100
net profit         = operating profit − interest and taxes
net margin %       = net profit ÷ revenue × 100
markup %           = gross profit ÷ COGS × 100   (shown for cross-reference; none when COGS = 0)
```

Sources:
- CFI, *Profit Margin*: https://corporatefinanceinstitute.com/resources/accounting/profit-margin/
- CFI, *Net Profit Margin*: https://corporatefinanceinstitute.com/resources/accounting/net-profit-margin-formula/
- AccountingTools, *Operating profit margin*: https://www.accountingtools.com/articles/what-is-the-operating-profit-margin.html

**Inputs:** revenue (> 0), COGS (≥ 0), operating expenses (≥ 0, default 0),
interest and taxes (≥ 0, default 0). Any period, as long as all four cover
the same one.

**Outputs:** each profit in dollars and each margin in percent; markup %.
Margins may be negative (a loss) — that's reported, not rejected.

**Test cases:**

| Revenue | COGS | Opex | Interest+tax | Gross | Operating | Net | Markup |
|---|---|---|---|---|---|---|---|
| 100,000 | 60,000 | 25,000 | 5,000 | 40,000 (40%) | 15,000 (15%) | 10,000 (10%) | 66.67% |
| 50 | 30 | 0 | 0 | 20 (40%) | 20 (40%) | 20 (40%) | 66.67% |
| 1,000 | 1,200 | 100 | 0 | −200 (−20%) | −300 (−30%) | −300 (−30%) | −16.67% |
| 500 | 0 | 0 | 0 | 500 (100%) | 500 (100%) | 500 (100%) | none |
| 0 | … | | | rejected: revenue must be > 0 | | | |
| −5 COGS | | | | rejected | | | |

**Benchmarks:** none shown. Industry margin figures change and vary widely;
the page links to Aswath Damodaran's margins-by-sector dataset (NYU Stern)
for readers who want them, without quoting numbers we can't keep current:
https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/margin.html

---

## Recipe Cost Calculator — `/recipe-cost-calculator`

**Search intent:** "recipe cost calculator", "recipe cost calculator free",
"cost per serving calculator". Feeds `/food-cost-calculator` (which starts
from a known plate cost) — the two link to each other.

**Formulas** (Culinary Institute of America; BCcampus *Basic Kitchen and Food
Service Management*):

```
as-purchased (AP) cost of amount used = package price × amount used ÷ package size
edible-portion (EP) cost              = AP cost ÷ (yield % ÷ 100)
batch cost                            = Σ EP cost of every ingredient
cost per serving                      = batch cost ÷ servings
suggested menu price (optional)       = cost per serving ÷ (target food cost % ÷ 100)
```

Yield % is the usable share after trimming and waste (EP weight ÷ AP weight);
100% for ingredients used whole. The amount used must be in the same unit as
the package size (both grams, both ounces, both "each") — the page says so,
rather than guessing unit conversions.

Sources:
- CIA, *Kitchen Calculations*: https://ciachef.edu/wp-content/uploads/2024/07/kitchen-calculations.pdf
- BCcampus, *Basic Kitchen and Food Service Management*, "Yield Testing": https://opentextbc.ca/basickitchenandfoodservicemanagement/chapter/yield-testing

**Inputs:** up to 6 ingredient rows (name — optional text that stays in the
browser; package price ≥ 0; package size > 0; amount used ≥ 0; yield %
1–100, default 100). Fully blank rows are ignored; a partly filled row is an
error naming that row. Servings > 0. Target food cost % optional, 1–100.

**Outputs:** cost per ingredient, batch cost, cost per serving, suggested menu
price per serving (when a target is given).

**Test cases:**

| Ingredient | Price | Size | Used | Yield | Cost |
|---|---|---|---|---|---|
| Flour | 4.00 | 2000 g | 500 g | 100% | 1.00 |
| Butter | 5.00 | 454 g | 113 g | 100% | 1.2445 |
| Eggs | 3.60 | 12 | 3 | 100% | 0.90 |
| **Batch** | | | | | **3.1445** |
| ÷ 8 servings | | | | | **0.3931** per serving |
| at 30% target food cost | | | | | **1.3102** menu price |

- Carrots 2.00 / 1000 g, 300 g used at 80% yield → 0.75 (CIA method: 0.60 AP ÷ 0.80).
- Beef tenderloin from the BCcampus example: 21.00 per lb at 70% yield → 30.00 per lb EP.
- Zero amount used → 0 cost (allowed).
- Rejected: package size 0; yield 0 or > 100; servings 0; no ingredient rows.
