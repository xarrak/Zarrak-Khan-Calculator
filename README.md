# Tip and Bill Splitter

A calculator that runs in the browser and works out a fair tip and who pays what when a group eats out together. It has two ways to split a bill:

- **Split evenly.** Enter the receipt and the number of people. The app shows the tip, the total and each person's share. When the total doesn't divide exactly, the extra cents are shown openly ("1 person pays 33.34, 2 people pay 33.33"), so the shares always add up to the bill.
- **Split by order.** For when one person paid for everyone. Enter what each person ordered. The app shares the tax, service charges and tip out in proportion to each order, shows what everyone owes, and warns if the orders don't add up to the receipt.

The receipt amounts and the tip are shared by both modes. Results update as you type, and invalid input gets a specific message instead of a result.

## Who it is for, and why I chose it

It's for groups of friends, family or colleagues settling a restaurant bill. Two kinds of user need different things:

- **A Diner** wants a fair tip and an even split, usually on a phone at the table.
- **A Bill Organiser** has already paid for everyone and needs to collect a different amount from each person, based on what they ordered. Any shortfall comes out of their own pocket.

When the bill arrives, three things go wrong in practice: people aren't sure what tip is fair; splitting evenly leaves leftover cents, so the shares don't add up; and working out who owes what from separate orders, plus a fair part of tax and tip, is slow and error-prone on a phone calculator.

I chose this calculator because the maths is simple but the edge cases (rounding, leftover cents, very small and very large amounts, invalid input) are exactly where real calculators get things wrong. That made it a good way to show careful requirements and testing in a small app.

## Product documents

1. [App roles](docs/app-roles.md): who uses the app
2. [Jobs to be done](docs/jobs-to-be-done.md): why they use it
3. [User stories with acceptance criteria](docs/user-stories.md): how the app helps, with every criterion numbered (for example S-6.10) and each story's status

Supporting documents:

- [Scope and decisions](docs/scope-and-decisions.md): what is in and out of scope, 36 numbered decisions (D-1 to D-36), the definition of done and a dated change log
- [Technical plan](docs/technical-plan.md): the stack, architecture and testing approach
- [Manual checklist](tests/manual-checklist.md): the hand checks in Chrome and Firefox, with results

## What is built

| Story | Role | Status |
|---|---|---|
| S-1 Enter the receipt amounts | Diner | Implemented |
| S-2 Choose a tip and see its amount | Diner | Implemented |
| S-3 Split the total evenly so the shares add up exactly | Diner | Implemented |
| S-10 Enter the receipt amounts when splitting by order | Bill Organiser | Implemented |
| S-5 List each person and what they ordered | Bill Organiser | Implemented |
| S-6 See what each person owes, with tax and tip shared in proportion | Bill Organiser | Implemented |
| S-7 Be warned when the amounts don't cover the bill | Bill Organiser | Implemented |
| S-4 Round everyone's share up to a whole amount | Diner | Not implemented (backlog) |
| S-8 Split a shared item between several people | Bill Organiser | Not implemented (backlog) |
| S-9 Copy a summary of who owes what | Bill Organiser | Not implemented (backlog) |

A story is marked Implemented only when it meets the [definition of done](docs/scope-and-decisions.md#definition-of-done-for-a-story):

- every acceptance criterion was checked by hand in Chrome
- its smoke criteria were also checked by hand in Firefox
- its automated tests pass

The backlog stories are fully specified but not built.

**Browsers checked by hand** (18 October 2026), with the results recorded in the [manual checklist](tests/manual-checklist.md):

- **Chrome 150.0.7871.256 (64-bit):** all 145 v1 criteria and 6 extra checks
- **Firefox 158.0:** the 21 smoke criteria and the 4 smoke extra checks

Edge and Safari were not tested, so they are not claimed. The app uses only standard features that all four browsers support (ES modules and BigInt).

A live copy runs on GitHub Pages at **https://xarrak.github.io/Zarrak-Khan-Calculator/** (see [Live version](#live-version-optional)). Running it locally, as described below, is still the main way to review the app.

## Prerequisites

- **Node.js 22 or later.** Developed and tested with Node.js 22.22.0. Node runs the local server and the tests. Check your version with `node --version`.
- **A current browser.** Checked in Chrome 150 and Firefox 158.

No paid accounts, API keys or cloud services are needed. There are no dependencies to install.

## Install and start

Run these in a terminal, in this order.

**1. Get the code.** Clone the repository from the link you were sent, then move into the folder that `git clone` created. Its name is the repository's name.

```bash
git clone <repository-link>
cd <repository-folder>
```

If you downloaded a zip instead, unzip it and `cd` into the unzipped folder.

**2. Install.** There is nothing to install. The project has no dependencies and no build step, so `npm install` isn't needed. Running it anyway is harmless: it reports `up to date` and changes nothing.

**3. Run the tests.** The summary at the end should show `pass 161` and `fail 0`.

```bash
npm test
```

**4. Start the app.**

```bash
npm start
```

The terminal shows `Tip and Bill Splitter is running at http://localhost:8080`. Open **http://localhost:8080** in your browser.

The server keeps running in that terminal until you press **Ctrl+C**. To run `npm test` again while the app is open, use a second terminal in the same folder.

**If port 8080 is busy,** the server says so. Start it on another port instead:

| Terminal | Command |
|---|---|
| macOS or Linux | `PORT=3000 npm start` |
| Windows PowerShell | `$env:PORT=3000; npm start` |
| Windows Command Prompt | `set PORT=3000&& npm start` |

**Don't open `src/index.html` directly** from your file browser. Browsers block JavaScript modules on pages opened from disk, so the form would show but nothing would calculate. The app must be served over HTTP, which is what `npm start` does.

**Without Node.js,** you can run `python3 -m http.server 8080` inside the `src` folder. On some Windows machines Python serves `.js` files with the wrong type, which gives a blank page. `npm start` doesn't have that problem.

## Live version (optional)

**https://xarrak.github.io/Zarrak-Khan-Calculator/**

This is a convenience copy of the same app. The local setup above is the main way to run and review it, and it is what the tests and the hand checks used.

The copy is published by the GitHub Actions workflow in `.github/workflows/pages.yml`, on every push to `main`:
1. It runs `npm test` with Node.js 22.
2. Only if every test passes, it publishes the `src/` folder to GitHub Pages. That folder holds the page, its styles and its scripts, and nothing else.

GitHub Pages is free for public repositories. It needs one setting, made once: in the repository, go to **Settings → Pages → Build and deployment**, and set **Source** to **GitHub Actions**.

## Tests

```bash
npm test
```

You can run this before starting the app, or in a second terminal while the app is running. It runs 161 automated tests with Node's built-in test runner. Every test name starts with the ID of the acceptance criterion it checks, for example `S-6.10: a tied leftover cent with large values goes to Person 1`.

| File | What it checks |
|---|---|
| `tests/diner.test.js` | The criteria of S-1, S-2 and S-3 |
| `tests/organiser.test.js` | The criteria of S-10, S-5, S-6 and S-7 |
| `tests/calc.test.js` | The arithmetic: tip rounding, even split, proportional shares |
| `tests/money.test.js` | Reading and formatting amounts, including 0.10 + 0.20 = 0.30 exactly |
| `tests/messages.test.js` | Every message in the app matches `docs/user-stories.md` word for word |
| `tests/safety.test.js` | 20,000 random inputs: no crash, and never NaN, Infinity, undefined or a blank result |

140 of the 145 v1 criteria have an automated test. The other five depend on the browser itself, so they are checked by hand only:

- S-1.34: a value filled in by autofill
- S-5.20 and S-5.24: the 30-character name limit, when typing and when pasting
- S-5.28: a double-click on Remove
- S-5.29: long names at phone width

The automated tests check the logic, not the page, so every v1 criterion was also checked by hand. The [manual checklist](tests/manual-checklist.md) is generated from the user stories by `node scripts/make-checklist.js`, which keeps the results already recorded when it is run again.

## How it works

- **Money is never a floating-point number.** Amounts are read as text straight into a whole number of cents, stored as JavaScript `BigInt`, and turned back into text only for display. So 0.10 + 0.20 is exactly 0.30.
- **Why BigInt and not ordinary whole numbers.** At large amounts, the split-by-order calculation multiplies values beyond the range ordinary JavaScript numbers hold exactly. Criterion S-6.10 is a real input where ordinary numbers give a leftover cent to the wrong person while the total still matches. Its test fails if BigInt is replaced.
- **Logic and page are separate.** `src/lib/` holds pure functions with no page code: `compute(state)` in `engine.js` returns every message and result line the page shows. `src/app.js` only copies that output onto the page, so the logic is fully testable without a browser.

```
README.md
.gitignore              keeps node_modules, dist, build, coverage, logs and zips out of the repository
.github/workflows/
  pages.yml             runs the tests, then publishes src/ to GitHub Pages
package.json            scripts only: "start" and "test"; no dependencies
CLAUDE.md               instructions given to the AI coding tool
docs/                   the product documents listed above
scripts/
  serve.js              the local server for src/ (Node's built-in http module)
  make-checklist.js     generates tests/manual-checklist.md from the user stories
src/
  index.html, styles.css, app.js   the page
  lib/                  money.js, validate.js, calc.js, messages.js, engine.js
tests/                  the automated tests, helpers.js and the manual checklist
```

## AI tool and model

- **Tool:** Claude, in the Claude app, using its built-in code workspace (file editing, a shell, and a headless Chromium browser for checking the page). The workspace is built on Claude Code, and it loaded `CLAUDE.md` automatically, so the build rules written there applied throughout.
- **Models.** The session log records which model wrote each reply:
  - **Claude Sonnet 4.6** answered my first 5 messages (16 and 17 October, up to 22:43). That covers the summary of the brief, the first drafts of the three product documents, and the format checks of App Roles, Jobs To Be Done and User Stories.
  - **Claude Opus 5.5** answered everything from message 6 onward (17 October, 22:47). That covers the strict review, the scope lock, the technical plan, all of the code and tests, the QA checks, the README and the deployment.

All of the work happened in that one conversation. The plan was to build in a separate Claude Code session in a terminal (decision D-28), but no separate session was used: the code was written in the same conversation, in the workspace described above.

AI also drafted the product documents, which I directed, reviewed and corrected, as the transcript shows.

## Code changed by hand

None. All code was written by the AI tool. My part was to define the requirements, review the output, and check every acceptance criterion by hand in Chrome and Firefox. I reported failures and decisions back to the AI rather than editing code myself.

## Assumptions

- **Currency.** One currency with 2 decimal places, such as PKR, USD, GBP or EUR, and no currency symbol is shown. Currencies without decimals, such as JPY, are not supported.
- **Limits.**
  - Subtotal: 0.01 to 1,000,000.00
  - Tax and service charges: 0 to 1,000,000.00
  - Each person's order: 0.01 to 1,000,000.00
  - Custom tip: 0 to 100%, with at most 2 decimal places
  - People: 1 to 50, in either mode
  - Names: up to 30 characters
- **What is entered.** Tax and service charges are one optional amount, taken from the receipt. The tip is a percentage of the subtotal **before** tax and service charges, rounded to the nearest cent, with exact halves rounded up.
- **Leftover cents.**
  - **Split evenly:** the extra cents are shown openly as a higher share and a lower share, such as "1 person pays 33.34, 2 people pay 33.33". Shares are not tied to named people in this mode.
  - **Split by order:** each person's share of tax and tip is rounded down to the cent. The cents left over go one at a time to the people with the largest remainders, and ties go to the person higher in the list.

  In both modes, the amounts always add up exactly to the total.
- **Orders that don't match the receipt** are allowed. The app still shows what everyone owes, plus a warning that states the exact difference.
- **Input rules.**
  - Invalid input is rejected with a specific message, never silently corrected.
  - The only exceptions are spaces around a value, a trailing `%` on the tip, and Eastern Arabic and Urdu digits, which are read as 0 to 9.
  - Commas and currency symbols are rejected, not stripped, because a comma could be a thousands separator or a decimal point.
  - A comma used as a decimal point (`12,50`) gets its own message asking for a point.

## Known limitations

- **Commas in results.** Results show commas (`1,260.00`) for readability, but inputs reject commas. A result pasted back into a field gets a message asking to remove them.
- **Phone keyboards.** On phones set to a language that uses a decimal comma, the number keyboard may not offer a decimal point.
- **Name length.** The 30-character name limit counts some emoji as 2 characters.
- **Accessibility.** This is best effort and not formally tested. Fields are labelled, errors are linked to their fields, and the page was checked by hand with the keyboard only.
- **Fair tips.** The app suggests common tip levels (0%, 10%, 15%, 20%) but gives no advice on local tipping customs.
- **Telling people what they owe.** Copying a summary to send is a backlog story (S-9) and is not built.

## Session transcripts

The full transcript of the AI session is in `transcripts/`. It is exported unedited, apart from removing any passwords, keys or tokens.
