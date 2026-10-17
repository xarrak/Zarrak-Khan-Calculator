# Tip and Bill Splitter: instructions for Claude Code

This is a take-home assignment. I am the candidate: I direct the work and check it, and you write the code. Reviewers will read the full transcript of our sessions, so be explicit about what you did, what you checked and what you were unsure of.

## Source of truth

@docs/user-stories.md
@docs/scope-and-decisions.md
@docs/technical-plan.md

`docs/app-roles.md` and `docs/jobs-to-be-done.md` give background. Read them if you need to know who the users are.

**The documents are locked.** Never edit anything in `docs/` unless I ask you to. If a criterion looks wrong, impossible, or in conflict with another, stop and tell me its ID. Don't work around it in code.

## Scope

- Build only the v1 stories: **S-1, S-2, S-3, S-10, S-5, S-6, S-7**.
- Never build S-4, S-8 or S-9, or anything listed under "Out of scope".
- Work in the build order in D-27. Do one step per request, then stop.

## Hard rules

- **No dependencies and no build step.** `package.json` has only `"type": "module"`, `"engines": {"node": ">=22"}`, and the scripts `start` and `test`.
- **Money is BigInt cents only (D-19).**
  - In `src/lib`, never use `parseFloat`, `Number()`, `toFixed()`, `Math.round()` or `toLocaleString()` on money.
  - Never mix BigInt and ordinary numbers.
  - Convert text to BigInt where input arrives, and BigInt to text for display.
- **Separation.**
  - `src/lib` never touches the DOM.
  - `src/app.js` contains no arithmetic and no message text. Every string it shows comes from `engine.js` or `messages.js`.
- **Exact wording.** Copy every message from `docs/user-stories.md` character for character, with straight apostrophes (D-25).
- **Live updates (D-21).** Never recreate a field the user is typing in. Rebuild people rows only on add or remove, and put the cursor back where it was.
- **Plain text only (D-24).** Insert names and all other strings with `textContent`, never `innerHTML`.
- **Form restore (D-22).** The form has `autocomplete="off"`.
- **Server (D-23).** `scripts/serve.js` serves only `src/`, sends `.js` as `text/javascript`, refuses paths outside `src/`, reads `PORT` (default 8080), and explains clearly when the port is busy.

## Tests

- `npm test` runs `node --test`.
- Every test name starts with the criterion ID it checks, for example `S-6.10 leftover cent tie with large values`.
- `tests/manual-checklist.md` is generated from the user stories. After any change to `docs/user-stories.md`, run `node scripts/make-checklist.js`; never edit its criterion text by hand. Results in its Chrome and Firefox columns are recorded by hand, and the script keeps them. It lists every v1 criterion with a Chrome column and a Firefox column, and marks the Firefox smoke criteria.
- When I report a failing criterion:
  1. If it can be tested automatically, write a test that fails first.
  2. Fix the code.
  3. Run `npm test`.
  4. Tell me the cause.

## At the end of every step

1. Run `npm test` and show the pass and fail counts.
2. Run this check and show the output. Any match is a bug to fix:
   `grep -nE "parseFloat|Number\(|toFixed|Math\.round|toLocaleString" src/lib/*.js`
3. Summarise:
   - which files changed
   - what you tested
   - anything you couldn't do, or did differently from the plan, and why
   - any assumption you made
4. Never mark a story Implemented and never change a Status in `docs/`. I check the criteria by hand and tell you when to update a status.
5. Don't write the README until I ask.
