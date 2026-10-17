# Technical Plan

Approved on 18 October 2026, after a pressure test. The decision numbers (D-n) refer to `scope-and-decisions.md`, and the criterion IDs (S-n.n) refer to `user-stories.md`.

## Stack

Plain HTML, CSS and JavaScript (ES modules), with no build step and no packages (D-15).

- **Prerequisite:** Node.js 22 or later (D-16). Node runs the tests and the local server.
- **Why:** the app is about 10 fields and some arithmetic. Every package or build step is one more thing that can fail on a reviewer's clean machine. With no dependencies, there's no `npm install` and no `node_modules`.
- **Browsers:** current Chrome, Edge, Firefox and Safari. Every feature used, including BigInt and ES modules, is supported in all of them.

## Commands

| Command | What it does |
|---|---|
| `npm start` | Serves `src/` at http://localhost:8080. The port can be changed with `PORT=3000 npm start`. |
| `npm test` | Runs every automated test with `node --test` |

`package.json` contains only `"type": "module"`, `"engines": {"node": ">=22"}` and the two scripts. It has no dependencies.

## Folder structure

```
Zarrak-Khan-Calculator/
  README.md
  .gitignore              # keeps node_modules, dist, build, coverage, logs and zips out of the repository
  package.json
  scripts/
    serve.js              # static server for src/, Node's http module only (D-17, D-23)
    make-checklist.js     # regenerates tests/manual-checklist.md from the user stories
  src/
    index.html            # markup; the form has autocomplete="off" (D-22)
    styles.css
    app.js                # UI only: state, events, copying engine output to the page (D-21, D-24)
    lib/                  # pure logic, no DOM, BigInt only (D-19)
      money.js            # text → BigInt cents; BigInt cents → "1,260.00"
      validate.js         # parsing and message precedence for every input type
      calc.js             # tip, even split, proportional allocation, receipt check
      messages.js         # every fixed message and template
      engine.js           # compute(state) → everything the screen shows
  tests/
    diner.test.js         # acceptance criteria of S-1, S-2 and S-3, named by criterion ID
    organiser.test.js     # acceptance criteria of S-10, S-5, S-6 and S-7, named by criterion ID
    calc.test.js          # the arithmetic: tip rounding, even split, proportional shares
    money.test.js         # reading and formatting amounts
    messages.test.js      # every message matches user-stories.md exactly (D-25)
    safety.test.js        # 20,000 random inputs: no crash, no NaN, Infinity, undefined or blank result
    manual-checklist.md   # every v1 criterion by ID, with Chrome and Firefox columns (generated)
    helpers.js            # shared test setup; not a test file itself
  docs/
    app-roles.md
    jobs-to-be-done.md
    user-stories.md
    scope-and-decisions.md
    technical-plan.md
  transcripts/
  .github/workflows/pages.yml   # tests, then publishes src/ to GitHub Pages (D-18; live)
```

## Architecture

`engine.js` exports `compute(state)`.

**`state` holds:**
- the selected mode
- the raw text of every field
- the tip choice, and the custom tip text
- the people list
- which fields the user has left

**`compute(state)` returns:**
- the error message for each field, or none
- which fields are outlined in red
- the results-area message, or the exact result lines for the current mode

**`app.js`** listens for input, leaving a field, clicks, add and remove, Reset and mode changes. On each one it updates `state`, calls `compute`, and copies the returned strings into the page. It never does arithmetic and never chooses wording.

**Rules for `app.js`:**
- Never recreate a field the user is typing in (D-21). Update only error text, outline classes and the results area.
- Rebuild people rows only when a row is added or removed, and put the cursor back where it was.
- Insert names and every other string as plain text, never as HTML (D-24).

## Money without floating-point errors

The rule is that money is a BigInt count of cents from input to display (D-6, D-19).

1. **Reading input.** The text is checked against a strict pattern. The whole part and the decimal part are joined as text and turned into BigInt, so `"1000.5"` becomes `100050n`. Then `"0.1"` plus `"0.2"` is exactly `30n`, shown as "0.30".
2. **Tip percentage.** It's held as BigInt hundredths of a percent, so 12.5% is `1250n`. The tip is `(subtotal × percent + 5000n) / 10000n`, which rounds exact halves up because every value is zero or positive.
3. **Even split.** `total / n` and `total % n`.
4. **Split by order.** Each share is `extra × ordered / sum` and its remainder is `extra × ordered % sum`, with the largest-remainder rule for leftover cents. S-6.10 proves this must be BigInt (D-20).
5. **Display.** The digits are grouped with commas by hand. `toLocaleString` is never used, so the result doesn't depend on the reviewer's language settings.
6. **Forbidden on money:** `parseFloat`, `Number()`, `toFixed()`, `Math.round()` and `toLocaleString()`. After each build step, `src/lib` is searched for these and any match is fixed.

## Testing

**Automated tests (`npm test`).** Every criterion with a calculated value or a message gets a test named with its ID, for example `S-6.10 leftover cent tie with large values`. Most criteria run through `compute(state)`, so the wording, the "Fix…" and "Fill in…" messages and the result lines are tested without a browser.

**Manual checklist (`tests/manual-checklist.md`).** Every v1 criterion is listed by ID, with a Chrome column and a Firefox column. It is generated from the user stories by `node scripts/make-checklist.js`, so its wording always matches. Rerun the script whenever the stories change: it keeps the results already recorded in the Chrome and Firefox columns.
- Chrome gets a full pass of all 145 v1 criteria.
- Firefox gets a smoke pass of about 20 criteria, marked "smoke". That's at least one normal case and one error case per story, plus Reset, plus a reload check that no old values are restored.
- Each tick records the date and the browser version.

**Story status** follows the definition of done in `scope-and-decisions.md`.

| Story | Automated | By hand only |
|---|---|---|
| S-1 | Parsing, every message, precedence, results lines, "Fix…" and "Fill in…" logic | Error appears on leaving the field. Red outline before leaving (S-1.26). Reset. A value filled in without typing (S-1.34) |
| S-2 | Tip amounts, half-up cases, label formatting, tip precedence | Preset and "Custom" selection. The custom value is kept when switching back |
| S-3 | Every split, singular and plural wording, people parsing | Live update while typing. Reset |
| S-10 | Every value, across both modes | Fields shared between modes. Reset keeps the mode |
| S-5 | Amount validation, "Person N" labels and renumbering, names of only spaces | Add and remove rows. Disabled controls. 30-character cap, including paste. Double-click on Remove (S-5.28). Long names at phone width (S-5.29) |
| S-6 | Every value, including S-6.10 | Live updates |
| S-7 | Every warning and total-row message | Warning appears and disappears live |

Backlog stories (S-4, S-8, S-9) have no tests, because they are not built.

## Build order (D-27)

1. `src/lib` and its tests, including S-6.10 and the message check.
2. Diner: S-1, S-2, S-3.
3. Organiser: S-10, S-5, S-6, S-7.
4. The live URL, only if time remains.

If time runs out, the unfinished stories stay **Not implemented** and the README says so.

## For the README

**Assumptions:**
- The app must be served over HTTP, through `npm start`. Opening `index.html` directly shows a blank page.
- Node.js 22 or later is needed to start the app and run the tests.
- Only currencies with 2 decimal places are supported (for example PKR, USD, GBP, EUR). Currencies with none, such as JPY, are not.
- Commas and currency symbols are rejected, not stripped (D-9). Results show commas, so a result pasted back into a field gets an error message.
- A comma used as a decimal point (`12,50`) gets its own message asking for a point (D-30). Spaces between digits get their own message too (D-31).
- Eastern Arabic and Urdu digits are accepted and read as 0 to 9 (D-32).
- Inputs are text fields with a decimal keyboard on phones, not number fields.
- On phones set to languages that use a decimal comma, the keyboard may not offer a decimal point.
- The 30-character name limit counts some emoji as 2 characters.
- Accessibility is best effort and not formally tested: fields are labelled, errors are linked to their fields, and results are announced when they change.

**Known risks and how they are handled:**
- **Floating-point money:** D-19, the search step, and test S-6.10.
- **Values filled in without typing (autofill, password managers):** D-35, checked by hand (S-1.34).
- **Double-click on Remove:** D-34, checked by hand (S-5.28).
- **Broken typing from live updates:** D-21, checked by hand.
- **Firefox restoring old values:** D-22, part of the Firefox smoke pass.
- **Untested browsers:** only the browsers actually tested are claimed. Safari and Edge are not claimed unless tested.
- **Time:** the build order and stop line in D-27.
