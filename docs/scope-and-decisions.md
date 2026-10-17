# Scope and Decisions

**Scope status: Locked on 17 October 2026, before the build started.**

**Change control.** After the lock, a change to scope or behaviour must follow these steps in order:
1. Update `user-stories.md` first.
2. Add a row to the change log at the end of this file.
3. Only then ask the AI coding tool to change the code.

The code is never allowed to drift from the documents.

## In scope for v1

| Story | Serves | Role | Status |
|---|---|---|---|
| S-1 Enter the receipt amounts | J-1 | Diner | Implemented |
| S-2 Choose a tip and see its amount | J-1 | Diner | Implemented |
| S-3 Split the total evenly so the shares add up exactly | J-2 | Diner | Implemented |
| S-10 Enter the receipt amounts when splitting by order | J-3 | Bill Organiser | Implemented |
| S-5 List each person and what they ordered | J-3 | Bill Organiser | Implemented |
| S-6 See what each person owes, with tax and tip shared in proportion | J-3 | Bill Organiser | Implemented |
| S-7 Be warned when the amounts don't cover the bill | J-4 | Bill Organiser | Implemented |

## Backlog (written, not built)

| Story | Serves | Role | Status |
|---|---|---|---|
| S-4 Round everyone's share up to a whole amount | J-2 | Diner | Not implemented |
| S-8 Split a shared item between several people | J-3 | Bill Organiser | Not implemented |
| S-9 Copy a summary of who owes what | J-5 | Bill Organiser | Not implemented |

## Out of scope

These have no story and will not be built:
- Choosing or converting currencies. No currency symbol is shown.
- Locale formats, such as a decimal comma (`12,50`) or Indian digit grouping (`1,00,000`).
- Entering individual menu items. Each person's order is entered as one amount.
- Saving bills, history, accounts or links to share.
- Scanning receipts, or taking payments or payment requests.
- Separate tip rules for service charges. Tax and service charges is one field, and it is never tipped on.
- Translation into other languages.

## Decisions log

| # | Question | Decision |
|---|---|---|
| D-1 | Scope for 2 to 4 hours | Diner flow and Organiser flow both in v1. Shared items, round-up and copy summary in the backlog. |
| D-2 | What is entered | Subtotal, plus one optional "Tax and service charges" amount. Tip is a percentage. |
| D-3 | What the tip is calculated on | The subtotal before tax and service charges. Rounded to the cent, with exact halves rounded up. |
| D-4 | Leftover cents in an even split | Uneven shares are shown openly. For example, "1 person pays 33.34, 2 people pay 33.33", always adding up exactly to the total. |
| D-5 | Leftover cents in a split by order | Largest remainder first. Ties go to the person higher in the list. |
| D-6 | Currency and precision | One currency, no symbol, 2 decimal places. All maths in whole cents, using exact integer arithmetic (BigInt) because maximum-value products exceed JavaScript's safe integer limit. |
| D-7 | Limits | Subtotal 0.01 to 1,000,000.00. Tax 0 to 1,000,000.00. Tip 0 to 100%. 1 to 50 people. Names up to 30 characters. |
| D-8 | Invalid input | Rejected with a specific message. Never silently rounded or corrected. The only exceptions are surrounding spaces and a single trailing `%` on the tip, which are ignored, and Eastern Arabic and Urdu digits, which are read as 0 to 9 (D-32). |
| D-9 | Commas and currency symbols | Rejected with their own message rather than stripped, to avoid guessing whether a comma is a thousands separator or a decimal point. A comma used as a decimal point gets its own message instead (D-30). |
| D-10 | Ordered amounts that don't match the receipt | Allowed, with a warning that states the exact gap. Amounts owed are still shown. |
| D-11 | Validation timing | Checked and recalculated on every keystroke. Results disappear straight away when an input is invalid. Message text appears when the user leaves the field. |
| D-12 | Reset | Clears everything, including both modes, and keeps the currently selected mode. |
| D-13 | Switching mode | Receipt fields are shared between modes. The people count and the people list are kept separately. |
| D-14 | "Must never" statements | About correctness, not permissions, because the app has no accounts. |
| D-15 | Stack | Plain HTML, CSS and JavaScript (ES modules), with no build step and no dependencies. The calculation logic sits in a pure module, separate from the page. |
| D-16 | Tests | Automated tests use Node's built-in test runner (`node --test`), with no packages. The prerequisite is **Node.js 22 or later**, because Node 20 reached end of life on 30 April 2026. The acceptance criteria are still checked by hand (see the definition of done). |
| D-17 | Running locally | `npm start` runs a small static server written with Node's own `http` module (no packages), because browsers block ES modules opened directly from a `file://` path. The README must say this. `python3 -m http.server` is documented as a fallback, with the warning that on some Windows machines it serves `.js` files with the wrong type, which shows a blank page. |
| D-18 | Live URL | GitHub Pages through a GitHub Actions workflow, in addition to the local instructions, not instead of them. **Last priority:** it is built only if time remains after the v1 stories are verified. |
| D-19 | Money types | All money code in `src/lib` takes and returns BigInt only. Text is converted to BigInt where input arrives, and back to text for display. BigInt is never mixed with ordinary numbers, because mixing them throws an error, which would be a crash. `parseFloat`, `Number()`, `toFixed()`, `Math.round()` and `toLocaleString()` are never used on money. |
| D-20 | Proof that BigInt is needed | Criterion S-6.10 uses a real input where ordinary numbers give a leftover cent to the wrong person while the total still matches. It is an automated test and a manual check. |
| D-21 | Live updates without breaking typing | The page never recreates a field the user is typing in. Each keystroke updates only error text, red outlines and the results area. People rows are rebuilt only on add or remove, and the cursor is put back where it was. |
| D-22 | Firefox form restore | The form turns off browser autofill (`autocomplete="off"`), so a reload can't show old values that the app's state doesn't know about. |
| D-23 | Local server safety | The server sends `.js` files as `text/javascript`, refuses any path outside `src/`, and reads the port from `PORT` (default 8080). If the port is busy, it says so clearly. |
| D-24 | Names | Names are always inserted into the page as plain text, never as HTML, so a pasted name such as `<img src=x onerror=alert(1)>` is shown, not run. |
| D-25 | Message wording | A test reads `user-stories.md` and checks that every message in `src/lib/messages.js` appears in it exactly, including straight apostrophes. This catches the AI rewording a message. |
| D-26 | Criterion IDs | Every acceptance criterion has an ID, such as S-3.7. Test names and manual checklist lines use these IDs. |
| D-27 | Build order and stop line | The build order is: (1) `src/lib` and its tests, (2) the Diner stories S-1 to S-3, (3) the Organiser stories S-10, S-5, S-6 and S-7, (4) the live URL. If time runs out, unfinished stories stay **Not implemented** and the README says so. They are not rushed. |
| D-28 | AI coding tool | **Planned:** Claude Code (CLI), run in the project folder, with a project `CLAUDE.md` loading the locked documents and the build rules into every session. **What happened:** all of the work, from planning to deployment, was done in one Claude app conversation, using the app's code workspace. That workspace is built on Claude Code and loaded `CLAUDE.md` automatically, so its rules applied throughout. No separate terminal session was used. The session log records the model behind each reply: Claude Sonnet 4.6 for the candidate's messages 1 to 5 (16 and 17 Oct, up to 22:43: the brief summary, the first document drafts and the format checks of roles, jobs and stories), and Claude Opus 5.5 from message 6 onward (17 Oct, 22:47). The README states both. |
| D-29 | Transcripts | The whole project took place in one Claude app conversation, which is `transcripts/session-01`, taken from the Claude account data export (Settings → Privacy → Export data) and left unedited apart from removing any passwords, keys or tokens. No separate Claude Code session took place, so there are no further transcripts. (The original plan also exported each Claude Code session with `/export transcripts/session-NN.md`.) |
| D-30 | Decimal comma | A comma followed by one or two digits and nothing else (`12,50`, `,5`) gets "Use a point for decimals, e.g. 12.50." in money inputs and the custom tip. The general comma message told users to remove the comma, which turned 12.50 into 1,250.00 with no warning (QA finding #6). |
| D-31 | Spaces between digits | `1 000`, including a pasted no-break space, gets "Remove the spaces, e.g. 1250.50." instead of the "digits" message, which was confusing because the user had typed digits (QA finding #7). |
| D-32 | Eastern Arabic and Urdu digits | `٠` to `٩` and `۰` to `۹` are read as 0 to 9 in every input. Urdu phone keyboards in Pakistan can produce them, and they were rejected with a message telling the user to use digits (QA finding #8). |
| D-33 | Other minus characters | A value starting with a minus sign `−`, an en dash `–` or an em dash `—` is negative, like a hyphen, so it gets "Amount can't be negative." (QA finding #9). |
| D-34 | Double-click on Remove | The second click of a double-click on "Remove" is ignored. After the first click the next row moves up under the pointer, and the second click removed it too, silently losing data (QA finding #10). |
| D-35 | Changes made without typing | The page updates on any change to a field, not only typing, and reads the value again when the field is left. A value filled in by an autofill tool that sends only a "change" event left the results showing the old amount (QA finding #13). |
| D-36 | Long names on phones | Person labels wrap long words, so a 30-letter name with no spaces can't make the page wider than a 360px screen. It made the page 541px wide (QA finding #15). |

## Accepted gaps

These were raised in review and accepted as they are. Each one will be stated in the README.
- **J-1, deciding what tip is fair.** The presets (0%, 10%, 15%, 20%) are the app's guidance on common tip levels. There is no advice on local customs, to avoid making claims about specific countries.
- **J-5, telling each person their amount.** This is served only by a backlog story (S-9), so v1 does not help with it.
- **Commas in output but not input.** Results show `1,260.00` with commas, but inputs reject commas, so a result copied back into a field gets an error message (see D-9).

## Definition of done for a story

A story is marked **Implemented** only when all four of these are true:
1. **Full hand pass in Chrome.** Every one of its acceptance criteria has been checked by hand in the running app in current Chrome, and ticked in `tests/manual-checklist.md` with the date and browser version.
2. **Smoke pass in Firefox.** Its criteria marked "smoke" in the checklist have been checked by hand in current Firefox. There are about 20 across v1, covering at least one normal case and one error case per story, plus Reset and form restore after a reload.
3. **Automated tests pass.** Every criterion with a calculated value or a message has a test named with its ID, and `npm test` passes.
4. **Records updated.** Its status has been updated in `user-stories.md`, and the README lists which browsers it was checked in.

Safari and Edge are not claimed unless they were actually tested.

If any criterion fails and isn't fixed, the story stays **Not implemented**, and the README says which criterion failed.

## Change log

| Date | Change | Reason |
|---|---|---|
| 17 Oct 2026 | Scope locked | Review complete |
| 18 Oct 2026 | Added criterion S-6.10, and corrected the arithmetic note in the shared definitions | The pressure test found the earlier S-6 maximum-value case gives the right answer with ordinary numbers, so it didn't prove BigInt was needed. S-6.10 does. |
| 18 Oct 2026 | Definition of done changed: full hand pass in Chrome, plus a Firefox smoke pass, plus automated tests (was: every criterion by hand in "a current browser") | 136 v1 criteria take about 70 minutes per browser by hand. A full pass in two browsers doesn't fit the time budget. |
| 18 Oct 2026 | Node prerequisite changed from 20 to 22 or later (D-16) | Node 20 reached end of life on 30 April 2026 |
| 18 Oct 2026 | Criterion IDs added to every criterion (D-26) | Traceability from tests and the checklist to exact criteria. Labels only, no change in behaviour. |
| 18 Oct 2026 | Live URL made last priority (D-18). Build rules D-19 to D-25 and build order D-27 added. | Findings from the technical plan's pressure test |
| 18 Oct 2026 | Claude Code chosen as the AI coding tool (D-28). Transcript plan recorded (D-29). | The last decision needed before the build |
| 18 Oct 2026 | S-3 criteria renumbered: the display rule had been labelled S-3.1 by mistake, so the criteria are now S-3.1 to S-3.16 and v1 has 135 criteria, not 136 | Found while writing the first tests, before any test used the old IDs. Labels only, no change in behaviour. |
| 18 Oct 2026 | QA fixes: decisions D-30 to D-36 added, and D-8 and D-9 amended. In `user-stories.md`: the money-input, custom-tip, number-of-people, names and validation-timing rules updated; two messages added to the error table; S-2.8 now uses `1,500` instead of `1,5` (a decimal comma now has its own message, checked in S-2.23); ten criteria added under "Found in QA testing" (S-1.30 to S-1.34, S-2.23, S-2.24, S-3.17, S-5.28, S-5.29). v1 now has 145 criteria. | A QA attack list of 15 inputs found 8 failures: a decimal comma that led to a 100x amount, three misleading messages, a double-click that removed two rows, results that ignored changes made without typing, and long names that broke the phone layout. |
| 18 Oct 2026 | Validation timing clarified: once a field is valid again, a later mistake waits until the field is left again (shared definitions, criterion S-1.26) | Behaviour fixed during the UI build (`editField` and `leaveField` in `engine.js`) but not written into the shared definitions at the time |
| 18 Oct 2026 | Manual checklist now generated by `scripts/make-checklist.js` and regenerated: 145 v1 criteria, 21 smoke (S-1.34 and S-5.28 added to the smoke set) and 6 extra checks. Technical plan and `CLAUDE.md` updated to match. | The checklist had been made with a one-off command, so it fell out of date when criteria were added. A script keeps it in step with the stories. |
| 18 Oct 2026 | Firefox smoke pass recorded in `tests/manual-checklist.md`: all 21 smoke criteria and the smoke extra checks X-1, X-2, X-3 and X-5 passed, checked by hand by the candidate (Firefox version still to be added). `scripts/make-checklist.js` now keeps recorded results when it runs again. No story status changed: the Chrome hand pass is still outstanding. | Definition of done, item 2. The script previously rebuilt the checklist from scratch, which would have wiped recorded results. |
| 18 Oct 2026 | Chrome hand pass recorded in `tests/manual-checklist.md`: all 145 v1 criteria and all 6 extra checks passed, checked by hand by the candidate (Chrome version still to be added). S-1, S-2, S-3, S-10, S-5, S-6 and S-7 set to **Implemented** in `user-stories.md`, with a Status column added to its traceability table and to the scope tables above. S-4, S-8 and S-9 stay Not implemented (backlog, not built). | Definition of done: items 1 (Chrome), 2 (Firefox smoke, recorded earlier) and 3 (161 automated tests passing) met for every v1 story. Item 4 is completed by this entry and by the README, which is still to be written and must list Chrome and Firefox as the browsers checked. |
| 18 Oct 2026 | Browser versions added to the hand-pass records in `tests/manual-checklist.md`: Chrome 150.0.7871.256 (Official Build) (64-bit) and Firefox 158.0 (Build #2016189055) | The two entries above recorded the passes before the versions were known. Definition of done, item 1, asks for the browser version. |
| 18 Oct 2026 | Project renamed from the placeholder `firstname-lastname-calculator` to `splitter-calculator`: the folder tree in `technical-plan.md`, the `name` in `package.json` (was `tip-and-bill-splitter`) and the packaged folder. The app's on-screen title, "Tip and Bill Splitter", is unchanged. | Requested by the candidate. |
| 18 Oct 2026 | Project renamed from `splitter-calculator` to `Zarrak-Khan-Calculator`: the folder tree in `technical-plan.md`, the packaged folder and the repository name. The `name` in `package.json` is `zarrak-khan-calculator`, in lowercase because npm's naming rules don't allow capital letters. The app's on-screen title, "Tip and Bill Splitter", is unchanged. | Requested by the candidate. Replaces the earlier rename above. |
| 18 Oct 2026 | Live URL (D-18): GitHub Actions workflow `.github/workflows/pages.yml` added. It runs `npm test` on Node.js 22 and, only if every test passes, publishes `src/` to GitHub Pages. Checked here: valid workflow file, and the app works when served from a sub-path the way Pages serves it. README gained a "Live version (optional)" section with a placeholder URL. **Not yet deployed**: no GitHub account is linked to the AI workspace and no repository exists yet, so the URL is unconfirmed. Local setup stays the primary instructions. | Requested by the candidate after the v1 stories were verified, as D-18 allows. |
| 18 Oct 2026 | Live URL published (D-18): https://xarrak.github.io/Zarrak-Khan-Calculator/ from the public repository `xarrak/Zarrak-Khan-Calculator`. The workflow's first run passed its tests on GitHub but its deploy step failed, because Pages was not yet switched on. After the candidate set Settings → Pages → Source to "GitHub Actions", the re-run passed both jobs. The page and its scripts were confirmed to be served from the live address. README placeholder replaced with the real URL. | Completes the live-URL step that D-18 left until last. |
| 18 Oct 2026 | D-28 and D-29 corrected to match what happened: one Claude app conversation in its code workspace (built on Claude Code), no separate Claude Code session, and two models, Claude Sonnet 4.6 for messages 1 to 5 and Claude Opus 5.5 from message 6 onward, as recorded in the session log. The technical plan's folder tree corrected to the real test files (`diner.test.js`, `organiser.test.js`, `helpers.js` instead of `validate.test.js` and `engine.test.js`), with `.gitignore` added and the Pages workflow marked as published. README's "AI tool and model" section updated to match. | The README, D-28 and the folder tree contradicted each other. The session log, checked while preparing the transcript, showed the earliest replies came from Claude Sonnet 4.6, which the README had not said. |
