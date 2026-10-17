# User Stories with Acceptance Criteria

> **Status note.** The seven v1 stories (S-1, S-2, S-3, S-10, S-5, S-6, S-7) are **Implemented**. Each met the definition of done in `scope-and-decisions.md` on 18 Oct 2026:
> - every one of its acceptance criteria was checked by hand in Chrome
> - its smoke-pass criteria were checked by hand in Firefox
> - its unit tests pass
>
> The results are recorded in `tests/manual-checklist.md`. The three backlog stories (S-4, S-8, S-9) are **Not implemented**: they are written but not built.
>
> "Planned for" shows whether a story is in scope for the first version (v1) or a possible next step (Backlog).
>
> **Criterion IDs.** Each criterion has an ID, such as **S-3.7**. Tests and the manual checklist refer to criteria by these IDs.

## Traceability

| Story | Serves | Role | Planned for | Status |
|---|---|---|---|---|
| S-1 Enter the receipt amounts | J-1 | Diner | v1 | Implemented |
| S-2 Choose a tip and see its amount | J-1 | Diner | v1 | Implemented |
| S-3 Split the total evenly | J-2 | Diner | v1 | Implemented |
| S-4 Round everyone's share up | J-2 | Diner | Backlog | Not implemented |
| S-10 Enter the receipt amounts when splitting by order | J-3 | Bill Organiser | v1 | Implemented |
| S-5 List each person and what they ordered | J-3 | Bill Organiser | v1 | Implemented |
| S-6 See what each person owes | J-3 | Bill Organiser | v1 | Implemented |
| S-7 Be warned when the amounts don't cover the bill | J-4 | Bill Organiser | v1 | Implemented |
| S-8 Split a shared item | J-3 | Bill Organiser | Backlog | Not implemented |
| S-9 Copy a summary of who owes what | J-5 | Bill Organiser | Backlog | Not implemented |

J-5 is served only by a backlog story, so the first version does not help with it.

## Shared definitions

These rules apply to every story. The acceptance criteria refer to them.

### Layout and controls

- **Mode.** Two options at the top of the page: "Split evenly" and "Split by order". "Split evenly" is selected when the page opens.
- **Receipt fields.** These are shared by both modes:
  - "Subtotal"
  - "Tax and service charges"
  - the tip options, a row of five choices: "0%", "10%", "15%", "20%" and "Custom"
- **Custom tip.** Choosing "Custom" shows a text field labelled "Custom tip (%)". It is empty the first time it is shown, and it keeps what was typed if the user picks a preset and then picks "Custom" again.
- **Split evenly** has one field, "Number of people".
- **Split by order** has a list of rows. Each row has a "Name" field, an "Ordered" amount field and a "Remove" control. Below the list is an "Add person" control.
- **Reset** is a control at the bottom of the page.

### Results area

**Split evenly.** These lines appear in this order:
1. "Subtotal" and the amount
2. "Tax and service charges" and the amount
3. "Tip (P%)" and the amount. P is the percentage chosen, or the custom value written without spaces, leading zeros or trailing decimal zeros. For example, `12.50` shows as "Tip (12.5%)", `007` as "Tip (7%)" and `0.10` as "Tip (0.1%)".
4. "Total" and the amount
5. the share lines, described in S-3

**Split by order:**
1. The same four receipt lines.
2. A table with one row per person and three columns: "Ordered", "Share of tax and tip" and "Owes".
3. A total row showing the sum of "Owes", with the receipt check message from S-7.

The receipt check message is either "Matches the receipt total." or a message stating the difference.

### Validation timing

- On every keystroke, every input is checked and the results are recalculated.
- The same happens whenever a field's value changes in any other way, such as pasting, undo, browser autofill or a password manager. The value is also read again when the field is left, so the results never disagree with what the fields show (D-35).
- An input that holds an invalid value is outlined in red straight away, and the results disappear straight away. A result is never shown for values that are no longer on screen.
- A field that is showing an error message is also outlined in red. This is what "highlighted" means in "Fix the highlighted fields to see the split."
- The error message text under a field appears when the user leaves that field. Once it is showing, it updates or disappears on every keystroke.
- Once the value is valid again, the message is gone. A later mistake in the same field waits until the field is left again, even if the field was left before (criterion S-1.26).
- A required field that is empty and has never been left is not an error yet. Once the user leaves it empty, it shows its error.
- The results area message:
  - while any input is invalid: "Fix the highlighted fields to see the split."
  - otherwise, while any required field is empty: "Fill in the fields above to see the split."
  - otherwise, the results

### Switching mode

- The receipt fields (subtotal, tax and service charges, and tip) are shared between the two modes. Switching keeps them.
- "Number of people" and the Split by order list are kept separately. Switching away from a mode and back restores what was in it.
- The first time "Split by order" is opened, it shows 2 empty unnamed rows, whatever the number of people in "Split evenly".

### Reset

Pressing "Reset" does the following, in both modes:
- clears the subtotal and tax and service charges
- selects 10% tip and empties the custom tip field
- sets the number of people to 2
- returns the Split by order list to 2 empty unnamed rows
- turns off any options
- removes all errors

The mode that is currently selected stays selected.

### Money inputs

Money inputs are the subtotal, the tax and service charges, each person's ordered amount, and a shared item's amount.

- Spaces before and after the value are ignored.
- Eastern Arabic digits (`٠` to `٩`) and Urdu digits (`۰` to `۹`) are read as 0 to 9 (D-32). This rule also applies to the custom tip and the number of people.
- A valid amount is digits with an optional single decimal point and at most 2 decimal places. Examples: `1250`, `1250.5`, `1250.50`, `.5`, `12.`, `007`.
- A **decimal comma** is a comma followed by one or two digits and nothing else, such as `12,50` or `,5`. It gets its own message, so that removing the comma doesn't turn 12.50 into 1,250.00 (D-30). A comma followed by three digits, as in `1,250`, is a thousands separator.
- An input counts as containing a comma or currency symbol if:
  - it contains a comma or any of `$ € £ ₹ ₨` anywhere, or
  - it starts or ends with `Rs`, `Rs.` or `PKR`, in any letter case, with or without a space. Examples: `Rs 1250`, `rs1250`, `1250Rs`, `pkr 1250`.
- **Spaces between digits**, including a no-break space in pasted text, as in `1 000`, get their own message (D-31).
- A value is **negative** if it starts with a hyphen `-`, a minus sign `−`, an en dash `–` or an em dash `—` (D-33).
- When an input breaks more than one rule, only the first matching message is shown, in this order:
  1. empty
  2. a decimal comma
  3. comma or currency symbol
  4. spaces between digits
  5. negative
  6. not a valid number (letters, `e` notation, `+`, more than one decimal point)
  7. more than 2 decimal places
  8. below the minimum
  9. above the maximum

### Custom tip

- Spaces before and after the value are ignored, and so is a single trailing `%`. For example, ` 15% ` means 15.
- The tip is calculated on the subtotal, before tax and service charges.
- When the value breaks more than one rule, only the first matching message is shown, in this order:
  1. empty
  2. a decimal comma, such as `12,5` (D-30)
  3. not a number: anything other than digits with an optional single decimal point. This includes letters, other commas, currency symbols, a minus sign, `e` notation and a second `%`.
  4. more than 2 decimal places
  5. above 100

### Number of people

- Spaces before and after the value are ignored.
- The value must be digits only, from 1 to 50. Leading zeros are allowed, so `03` means 3. Eastern Arabic and Urdu digits count as digits (D-32).
- Anything else is rejected, including `3.0`, `-3`, `3 people` and `1,000`.

### Names (Split by order)

- A name is optional, up to 30 characters, and may contain any characters. A long name with no spaces wraps onto more lines rather than making the page wider (D-36).
- Spaces before and after a name are ignored.
- A name that is empty, or only spaces, is shown as "Person N", where N is the row's current position in the list.

### Tax and service charges

This is one optional field. Leaving it empty means 0. It covers GST, sales tax and any service charge printed on the receipt.

### Arithmetic

- All calculations use whole cents.
- The tip is rounded to the nearest cent, with exact halves rounded up. For example, 1.5 cents becomes 2 cents.
- Results must be exact at every allowed limit. At large values, some intermediate products in the Split by order calculation exceed 9,007,199,254,740,991, the largest whole number JavaScript's normal numbers store exactly. Remainders worked out from those products can be wrong, which gives a leftover cent to the wrong person while the total still matches.
- The implementation must therefore use exact integer arithmetic (BigInt) for all money. Criterion S-6.10 is a real input where ordinary numbers give the wrong answer.

### Display

- Results show 2 decimal places and comma thousands separators, for example `1,260.00`.
- No currency symbol is shown.
- Results use commas for readability, but money inputs reject commas. A result copied back into a field shows "Remove commas and currency symbols, e.g. 1250.50." This is a known limitation, recorded in the README.

### Limits

| Input | Allowed |
|---|---|
| Subtotal | 0.01 to 1,000,000.00 |
| Tax and service charges | 0 to 1,000,000.00 (empty = 0) |
| Ordered amount per person | 0.01 to 1,000,000.00 |
| Custom tip | 0 to 100, at most 2 decimal places |
| Number of people (Split evenly) | Whole number from 1 to 50 |
| People listed (Split by order) | 1 to 50 rows |
| Person's name | Optional, up to 30 characters |

### Error messages

| Case | Message |
|---|---|
| Subtotal empty | "Enter the bill subtotal." |
| Decimal comma in any money input or the custom tip | "Use a point for decimals, e.g. 12.50." |
| Comma or currency symbol in any money input | "Remove commas and currency symbols, e.g. 1250.50." |
| Spaces between digits in any money input | "Remove the spaces, e.g. 1250.50." |
| Negative money input | "Amount can't be negative." |
| Money input is not a valid number | "Enter an amount using digits and an optional decimal point, e.g. 1250.50." |
| More than 2 decimal places (money input or custom tip) | "Use at most 2 decimal places." |
| Subtotal below 0.01 | "Subtotal must be at least 0.01." |
| Any money input above 1,000,000.00 | "Amount can't be more than 1,000,000.00." |
| Custom tip empty | "Enter a tip percentage." |
| Custom tip not a number, or above 100 | "Tip must be a number from 0 to 100." |
| Number of people invalid | "Number of people must be a whole number from 1 to 50." |
| Ordered amount empty or below 0.01 | "Enter what this person ordered (at least 0.01)." |
| Shared item amount empty or below 0.01 (backlog, S-8) | "Enter the shared item's amount (at least 0.01)." |
| Shared item with no one ticked (backlog, S-8) | "Choose at least one person who shared this item." |

### Other fixed messages

| Where | Message |
|---|---|
| Results area, an input is invalid | "Fix the highlighted fields to see the split." |
| Results area, a required field is empty | "Fill in the fields above to see the split." |
| "Add person" at 50 rows (S-5) | "Up to 50 people." |
| Receipt check, amounts match (S-6, S-7) | "Matches the receipt total." |
| Warning, amounts below subtotal (S-7) | "The amounts entered add up to A, but the receipt subtotal is S. D is not assigned to anyone." |
| Warning, amounts above subtotal (S-7) | "The amounts entered add up to A, which is D more than the receipt subtotal of S. Check for an item entered twice." |
| Total row, below receipt total (S-7) | "D less than the receipt total of T." |
| Total row, above receipt total (S-7) | "D more than the receipt total of T." |
| Copy succeeded (backlog, S-9) | "Copied." |
| Copy blocked (backlog, S-9) | "Couldn't copy automatically. Select the text below and copy it." |

In these messages:
- A is the total of the amounts entered
- S is the receipt subtotal
- T is the receipt total (subtotal + tax and service charges + tip)
- D is the difference

All are formatted as described under Display.

---

## Diner stories

### S-1: Enter the receipt amounts
**Serves:** J-1 · **Role:** Diner · **Status:** Implemented · **Planned for:** v1

As a Diner, I want to enter the amounts printed on the receipt and be told straight away if something is wrong, so that the tip and split are based on the real bill.

**Normal case**
- **S-1.1** Given the page has just opened, when I look at the form, then:
  - "Split evenly" is selected
  - "Subtotal" and "Tax and service charges" are empty
  - "10%" is selected
  - "Number of people" is 2
  - the results area says "Fill in the fields above to see the split."
- **S-1.2** Given I enter subtotal `1000` and tax `160`, when the results appear, then they show "Subtotal 1,000.00", "Tax and service charges 160.00", "Tip (10%) 100.00" and "Total 1,260.00", in that order.
- **S-1.3** Given I enter subtotal `1000` and leave tax empty, when the results appear, then they show "Tax and service charges 0.00".
- **S-1.4** Given I enter subtotal ` 1000.50 ` with spaces around it, when the results appear, then they show "Subtotal 1,000.50".
- **S-1.5** Given I enter subtotal `.5`, `12.` or `007`, when the results appear, then they show "Subtotal 0.50", "Subtotal 12.00" or "Subtotal 7.00" respectively.

**Invalid input**
- **S-1.6** Given I click into the subtotal and leave it empty, when I move to the next field, then I see "Enter the bill subtotal." under the subtotal, and the results area says "Fix the highlighted fields to see the split."
- **S-1.7** Given I enter subtotal `abc`, `12abc`, `+5` or `10.0.5`, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50." and no results are shown.
- **S-1.8** Given I paste `1,250.50`, `Rs 1250`, `rs1250`, `1250Rs`, `$1250`, `1250 PKR` or `₨1,250` into the subtotal, when I leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50." and no results are shown.
- **S-1.9** Given I enter subtotal `-20`, when I leave the field, then I see "Amount can't be negative." and no results are shown.
- **S-1.10** Given a valid subtotal, when I enter tax `abc` and leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50." under the tax field and no results are shown.
- **S-1.11** Given a valid subtotal, when I enter tax `-5` and leave the field, then I see "Amount can't be negative." under the tax field and no results are shown.
- **S-1.12** Given a valid subtotal, when I enter tax `Rs 160` and leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50." under the tax field and no results are shown.

**Boundary values**
- **S-1.13** Given I enter subtotal `0` or `0.00`, when I leave the field, then I see "Subtotal must be at least 0.01." and no results are shown.
- **S-1.14** Given I enter subtotal `0.01`, when the results appear, then they show "Subtotal 0.01".
- **S-1.15** Given I enter subtotal `1`, when the results appear, then they show "Subtotal 1.00".
- **S-1.16** Given I enter subtotal `1000000`, when the results appear, then they show "Subtotal 1,000,000.00".
- **S-1.17** Given I enter subtotal `1000000.01`, when I leave the field, then I see "Amount can't be more than 1,000,000.00." and no results are shown.
- **S-1.18** Given subtotal `1`, when I enter tax `0`, then no error is shown and the results show "Tax and service charges 0.00".
- **S-1.19** Given subtotal `1`, when I enter tax `1000000` and leave the field, then no error is shown and the results show "Tax and service charges 1,000,000.00" and "Total 1,000,001.10".
- **S-1.20** Given subtotal `1`, when I enter tax `1000000.01` and leave the field, then I see "Amount can't be more than 1,000,000.00." under the tax field and no results are shown.

**Very large and very small numbers**
- **S-1.21** Given I enter subtotal `1e15`, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-1.22** Given I enter subtotal `1000000000000000`, when I leave the field, then I see "Amount can't be more than 1,000,000.00."
- **S-1.23** Given I enter subtotal `0.001` or `10.555`, when I leave the field, then I see "Use at most 2 decimal places."
- **S-1.24** Given I enter tax `0.001`, when I leave the field, then I see "Use at most 2 decimal places." under the tax field.

**Carrying on after a result or an error**
- **S-1.25** Given the subtotal shows an error, when I correct it to `1000`, then the error disappears as I type and results appear.
- **S-1.26** Given results are shown for subtotal `100`, when I type `a` so the field reads `100a` and before I leave the field, then:
  - the results disappear straight away
  - the subtotal is outlined in red
  - the results area says "Fix the highlighted fields to see the split."

  When I then leave the field, I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-1.27** Given results are shown, when I change the subtotal to `abc` and then to `500`, then results reappear showing "Subtotal 500.00".
- **S-1.28** Given both subtotal and tax show errors, when I fix only the subtotal, then no results are shown until the tax is fixed too.
- **S-1.29** Given I have entered values and errors are showing on "Split evenly", when I press "Reset", then the form is as described in the first normal case, and no errors are shown.

**Found in QA testing (added 18 Oct 2026)**
- **S-1.30** Given I enter subtotal `12,50` or `,5`, when I leave the field, then I see "Use a point for decimals, e.g. 12.50." and no results are shown. Given I enter `1,250` instead, then I see "Remove commas and currency symbols, e.g. 1250.50."
- **S-1.31** Given I enter subtotal `1 000`, or paste `1 000.50` containing a no-break space, when I leave the field, then I see "Remove the spaces, e.g. 1250.50." and no results are shown.
- **S-1.32** Given I enter subtotal `۱۰۰` (Urdu digits) or `١٠٠` (Eastern Arabic digits), when the results appear, then they show "Subtotal 100.00".
- **S-1.33** Given I paste subtotal `−5` (with a minus sign) or `–5` (with an en dash), when I leave the field, then I see "Amount can't be negative." and no results are shown.
- **S-1.34** Given results are shown for subtotal `100`, when browser autofill or a password manager changes the subtotal to `500` without any typing, then the results show "Subtotal 500.00".

### S-2: Choose a tip and see its amount
**Serves:** J-1 · **Role:** Diner · **Status:** Implemented · **Planned for:** v1

As a Diner, I want to choose a common tip percentage or type my own and see the tip amount and grand total, so that I can settle on a fair tip quickly.

**Normal case**
- **S-2.1** Given subtotal `1000` and tax `160`, when "10%" is selected, then I see "Tip (10%) 100.00" and "Total 1,260.00". The tip is calculated on the subtotal only.
- **S-2.2** Given subtotal `1000` and tax `160`, when I select "20%", then the results update to "Tip (20%) 200.00" and "Total 1,360.00".
- **S-2.3** Given subtotal `10.05` and tax empty, when I select "15%", then I see "Tip (15%) 1.51" (1.5075 rounded) and "Total 11.56".
- **S-2.4** Given subtotal `200` and tax empty, when I select "Custom" and type `12.5` in "Custom tip (%)", then I see "Tip (12.5%) 25.00" and "Total 225.00".
- **S-2.5** Given subtotal `200`, when I paste ` 15% ` into "Custom tip (%)", then it is read as 15 and I see "Tip (15%) 30.00".
- **S-2.6** Given subtotal `200`, when I enter custom tip `12.50`, then I see "Tip (12.5%) 25.00". When I enter `007`, then I see "Tip (7%) 14.00".

**Invalid input**
- **S-2.7** Given I select "Custom" and leave "Custom tip (%)" empty, when I leave the field, then I see "Enter a tip percentage." and no results are shown.
- **S-2.8** Given I enter custom tip `ten`, `-5`, `-0.001`, `1,500`, `$15` or `15%%`, when I leave the field, then I see "Tip must be a number from 0 to 100." and no results are shown.

**Boundary values**
- **S-2.9** Given subtotal `1000` and tax `160`, when I select "0%", then I see "Tip (0%) 0.00" and "Total 1,160.00". When I enter custom tip `0`, then I see the same amounts.
- **S-2.10** Given subtotal `1000`, when I enter custom tip `100`, then I see "Tip (100%) 1,000.00".
- **S-2.11** Given I enter custom tip `100.01`, when I leave the field, then I see "Tip must be a number from 0 to 100."
- **S-2.12** Given I enter custom tip `100.001`, when I leave the field, then I see "Use at most 2 decimal places." This rule is checked before the range.
- **S-2.13** Given subtotal `0.10` and "15%", when the results appear, then I see "Tip (15%) 0.02" (exactly 1.5 cents, rounded up) and "Total 0.12".
- **S-2.14** Given subtotal `0.05` and "10%", when the results appear, then I see "Tip (10%) 0.01" (exactly 0.5 cents, rounded up) and "Total 0.06".

**Very large and very small numbers**
- **S-2.15** Given subtotal `1000000`, tax `1000000` and custom tip `100`, when the results appear, then I see "Tip (100%) 1,000,000.00" and "Total 3,000,000.00" exactly.
- **S-2.16** Given subtotal `1000000`, when I enter custom tip `0.01`, then I see "Tip (0.01%) 100.00".
- **S-2.17** Given subtotal `0.01` and "10%", when the results appear, then I see "Tip (10%) 0.00" (0.1 cent rounds down) and "Total 0.01".
- **S-2.18** Given I enter custom tip `1e15`, when I leave the field, then I see "Tip must be a number from 0 to 100."
- **S-2.19** Given I enter custom tip `0.001`, when I leave the field, then I see "Use at most 2 decimal places."

**Carrying on after a result or an error**
- **S-2.20** Given results are shown for "10%" and subtotal `1000`, when I change the subtotal to `2000`, then the results show "Tip (10%) 200.00" without pressing any button.
- **S-2.21** Given custom tip shows "Tip must be a number from 0 to 100.", when I select "15%", then the error disappears and results appear using 15%.
- **S-2.22** Given I then select "Custom" again, when I look at "Custom tip (%)", then it still holds what I typed, its error is shown again and no results are shown.

**Found in QA testing (added 18 Oct 2026)**
- **S-2.23** Given I enter custom tip `12,5`, when I leave the field, then I see "Use a point for decimals, e.g. 12.50." and no results are shown.
- **S-2.24** Given subtotal `200`, when I enter custom tip `۱۵` (Urdu digits), then I see "Tip (15%) 30.00".

### S-3: Split the total evenly so the shares add up exactly
**Serves:** J-2 · **Role:** Diner · **Status:** Implemented · **Planned for:** v1

As a Diner, I want the grand total split evenly between the number of people, with any leftover cents shown openly, so that the shares add up exactly to the bill.

Display rule:
- When every share is equal, one line shows "Each person pays X".
- Otherwise there are two lines, with the higher share first, each using "1 person pays" or "N people pay".
- A final line shows "N shares add up to TOTAL", or "1 share adds up to TOTAL" when there is 1 person.

**Normal case**
- **S-3.1** Given a total of 1,260.00, when I enter 4 people, then I see "Each person pays 315.00" and "4 shares add up to 1,260.00".
- **S-3.2** Given a total of 100.00 (subtotal `100`, tax empty, "0%"), when I enter 3 people, then I see "1 person pays 33.34", "2 people pay 33.33" and "3 shares add up to 100.00".
- **S-3.3** Given a total of 1,260.00, when I enter ` 4 ` or `04`, then I see "Each person pays 315.00".

**Invalid input**
- **S-3.4** Given I clear the number of people, or enter `two`, `3 people`, `-3`, `2.5`, `3.0` or `1,000`, when I leave the field, then I see "Number of people must be a whole number from 1 to 50." and no results are shown.

**Boundary values**
- **S-3.5** Given I enter `0` people, when I leave the field, then I see "Number of people must be a whole number from 1 to 50."
- **S-3.6** Given a total of 1,260.00, when I enter 1 person, then I see "Each person pays 1,260.00" and "1 share adds up to 1,260.00".
- **S-3.7** Given a total of 1,260.00, when I enter 50 people, then I see "Each person pays 25.20" and "50 shares add up to 1,260.00".
- **S-3.8** Given I enter `51` people, when I leave the field, then I see "Number of people must be a whole number from 1 to 50."

**Very large and very small numbers**
- **S-3.9** Given a total of 3,000,000.00, when I enter 7 people, then I see "6 people pay 428,571.43", "1 person pays 428,571.42" and "7 shares add up to 3,000,000.00".
- **S-3.10** Given a total of 3,000,000.00, when I enter 50 people, then I see "Each person pays 60,000.00".
- **S-3.11** Given a total of 0.02 (subtotal `0.02`, "0%"), when I enter 3 people, then I see "2 people pay 0.01", "1 person pays 0.00" and "3 shares add up to 0.02".
- **S-3.12** Given a total of 0.01 (subtotal `0.01`, "0%"), when I enter 50 people, then I see "1 person pays 0.01", "49 people pay 0.00" and "50 shares add up to 0.01".
- **S-3.13** Given I enter `1e15` or `0.001` people, when I leave the field, then I see "Number of people must be a whole number from 1 to 50."

**Carrying on after a result or an error**
- **S-3.14** Given a total of 1,260.00 and results shown for 3 people, when I change it to 4, then I see "Each person pays 315.00" without pressing any button.
- **S-3.15** Given results are shown, when I change the number of people to `two`, then the results disappear straight away and the field is outlined in red. When I correct it to `2`, then I see "Each person pays 630.00" for a total of 1,260.00.
- **S-3.16** Given I have entered values on "Split evenly", when I press "Reset", then the form is as described in the first normal case of S-1.

**Found in QA testing (added 18 Oct 2026)**
- **S-3.17** Given a total of 1,260.00, when I enter `۴` (the Urdu digit 4) as the number of people, then I see "Each person pays 315.00".

### S-4: Round everyone's share up to a whole amount
**Serves:** J-2 · **Role:** Diner · **Status:** Not implemented · **Planned for:** Backlog

As a Diner, I want the option for everyone to pay the same share rounded up to a whole number, with the extra added to the tip, so that we can pay in notes or round transfers.

When "Round up shares" is on:
- A line "Extra tip from rounding X" appears just before "Total".
- "Total" includes the extra, so the shares still add up exactly to the Total shown, as the Diner role requires.
- In these criteria, "bill total" means the total before rounding.

**Normal case**
- **S-4.1** Given a bill total of 100.00 and 3 people, when I turn on "Round up shares", then I see:
  - "Extra tip from rounding 2.00"
  - "Total 102.00"
  - "Each person pays 34.00"
  - "3 shares add up to 102.00"
- **S-4.2** Given a bill total of 1,260.00 and 4 people, when I turn on "Round up shares", then I see "Extra tip from rounding 0.00", "Total 1,260.00" and "Each person pays 315.00".

**Invalid input**
- **S-4.3** Given "Round up shares" is on, when I enter `two` people and leave the field, then I see "Number of people must be a whole number from 1 to 50." and no results are shown. When I correct it to `3` for a bill total of 100.00, then I see "Each person pays 34.00" and "Total 102.00" again.

**Boundary values**
- **S-4.4** Given a bill total of 0.01 and 1 person, when I turn on "Round up shares", then I see "Extra tip from rounding 0.99", "Total 1.00" and "Each person pays 1.00".
- **S-4.5** Given a bill total of 1,260.00 and 50 people, when I turn on "Round up shares", then I see "Extra tip from rounding 40.00", "Total 1,300.00" and "Each person pays 26.00".

**Very large and very small numbers**
- **S-4.6** Given a bill total of 3,000,000.00 and 7 people, when I turn on "Round up shares", then I see "Extra tip from rounding 4.00", "Total 3,000,004.00" and "Each person pays 428,572.00".
- **S-4.7** Given a bill total of 0.02 and 3 people, when I turn on "Round up shares", then I see "Extra tip from rounding 2.98", "Total 3.00" and "Each person pays 1.00".

**Carrying on after a result or an error**
- **S-4.8** Given "Round up shares" is on with a bill total of 100.00, when I change 3 people to 4, then I see "Extra tip from rounding 0.00", "Total 100.00" and "Each person pays 25.00".
- **S-4.9** Given "Round up shares" is on, when I turn it off, then the exact shares from S-3 are shown again.
- **S-4.10** Given "Round up shares" is on, when I press "Reset", then it is turned off.

---

## Bill Organiser stories

### S-10: Enter the receipt amounts when splitting by order
**Serves:** J-3 · **Role:** Bill Organiser · **Status:** Implemented · **Planned for:** v1

As a Bill Organiser, I want to enter the receipt amounts and tip while splitting by order, so that each person's share of tax and tip is based on the real bill.

The receipt fields follow the same rules and messages as in S-1 and S-2. The criteria below check them in "Split by order".

**Normal case**
- **S-10.1** Given the page has just opened, when I select "Split by order", then:
  - "Subtotal" and "Tax and service charges" are empty
  - "10%" is selected
  - there are 2 empty unnamed rows
  - the results area says "Fill in the fields above to see the split."
- **S-10.2** Given "Split by order" with subtotal `100`, tax `16` and "10%", and Ali ordered `60` and Sara ordered `40`, when the results appear, then they show "Subtotal 100.00", "Tax and service charges 16.00", "Tip (10%) 10.00" and "Total 126.00", followed by the table from S-6.
- **S-10.3** Given the same values, when I select "Custom" and type `12.5`, then I see:
  - "Tip (12.5%) 12.50" and "Total 128.50"
  - Ali: Share of tax and tip 17.10, Owes 77.10
  - Sara: Share of tax and tip 11.40, Owes 51.40
  - a total row of 128.50 with "Matches the receipt total."

**Invalid input**
- **S-10.4** Given "Split by order" with valid rows, when I enter subtotal `abc` and leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50." and no amounts owed are shown.
- **S-10.5** Given "Split by order" with valid rows, when I enter subtotal `Rs 100` and leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50." and no amounts owed are shown.
- **S-10.6** Given "Split by order" with valid rows, when I enter tax `-5` and leave the field, then I see "Amount can't be negative." under the tax field and no amounts owed are shown.
- **S-10.7** Given "Split by order" with valid rows, when I enter custom tip `ten` and leave the field, then I see "Tip must be a number from 0 to 100." and no amounts owed are shown.

**Boundary values**
- **S-10.8** Given subtotal `100`, tax `16`, and Ali `60` and Sara `40`, when I select "0%", then:
  - Ali: Share of tax and tip 9.60, Owes 69.60
  - Sara: Share of tax and tip 6.40, Owes 46.40
  - the total row shows 116.00
- **S-10.9** Given "Split by order", when I enter subtotal `0` and leave the field, then I see "Subtotal must be at least 0.01."
- **S-10.10** Given "Split by order", when I enter subtotal `1000000.01` and leave the field, then I see "Amount can't be more than 1,000,000.00."

**Very large and very small numbers**
- **S-10.11** Given "Split by order", when I enter subtotal `1e15` and leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-10.12** Given "Split by order", when I enter subtotal `0.001` and leave the field, then I see "Use at most 2 decimal places."
- The largest and smallest valid receipts are checked in S-6.

**Carrying on after a result or an error**
- **S-10.13** Given subtotal `100`, tax `16` and "10%", and Ali `60` and Sara `40`, when I select "20%", then:
  - Ali owes 81.60 and Sara owes 54.40
  - the total row shows 136.00 with "Matches the receipt total."
- **S-10.14** Given I entered subtotal `100` on "Split by order", when I switch to "Split evenly", then "Subtotal" shows `100`.
- **S-10.15** Given values and errors on "Split by order", when I press "Reset", then the receipt fields and rows are as described in the first normal case, no errors are shown, and "Split by order" stays selected.

### S-5: List each person and what they ordered
**Serves:** J-3 · **Role:** Bill Organiser · **Status:** Implemented · **Planned for:** v1

As a Bill Organiser, I want to list each person with the amount they ordered, so that each person's amount owed is based on their own order.

**Normal case**
- **S-5.1** Given "Split evenly" with 4 people and a subtotal, tax and tip entered, when I select "Split by order" for the first time, then the subtotal, tax and tip are kept and I see 2 rows labelled "Person 1" and "Person 2", each with an empty "Ordered" field.
- **S-5.2** Given I then switch back to "Split evenly", when I look at "Number of people", then it still shows 4.
- **S-5.3** Given 2 rows, when I press "Add person", then a row "Person 3" appears with an empty "Ordered" field.
- **S-5.4** Given 3 unnamed rows with amounts `10`, `20` and `30`, when I press "Remove" on the second row, then it is removed, and the remaining rows are "Person 1" with `10` and "Person 2" with `30`.
- **S-5.5** Given I type the name `Ali` in row 1, when results appear, then row 1 is labelled "Ali". When I clear the name, then it is labelled "Person 1" again.
- **S-5.6** Given I type a name of only spaces in row 1, when results appear, then row 1 is labelled "Person 1".
- **S-5.7** Given I am on "Split by order", when I switch to "Split evenly" and back, then my rows, names and amounts are still there.

**Invalid input**
- **S-5.8** Given I click into a person's "Ordered" field and leave it empty, when I move to the next field, then I see "Enter what this person ordered (at least 0.01)." on that row and no results are shown.
- **S-5.9** Given I enter a person's amount as `abc`, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50." on that row and no results are shown.
- **S-5.10** Given I paste `1,200`, `Rs 1200` or `1200pkr` as a person's amount, when I leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50." on that row and no results are shown.
- **S-5.11** Given I enter `-5` as a person's amount, when I leave the field, then I see "Amount can't be negative." on that row and no results are shown.
- **S-5.12** Given I enter the name `Khan, Ali`, when results appear, then the row is labelled "Khan, Ali".

**Boundary values**
- **S-5.13** Given I enter `0` as a person's amount, when I leave the field, then I see "Enter what this person ordered (at least 0.01)."
- **S-5.14** Given subtotal `0.01` and one row, when I enter `0.01` as its amount, then no error is shown and the row's "Ordered" column shows 0.01.
- **S-5.15** Given subtotal `1` and one row, when I enter `1` as its amount, then no error is shown and the row's "Ordered" column shows 1.00.
- **S-5.16** Given subtotal `1000000` and one row, when I enter `1000000` as its amount, then no error is shown and the row's "Ordered" column shows 1,000,000.00.
- **S-5.17** Given I enter `1000000.01` as a person's amount, when I leave the field, then I see "Amount can't be more than 1,000,000.00."
- **S-5.18** Given only 1 row remains, when I look at it, then its "Remove" control is disabled.
- **S-5.19** Given 50 rows, when I look at "Add person", then it is disabled and "Up to 50 people." is shown next to it.
- **S-5.20** Given I type a 30-character name, then all 30 characters are kept. When I try to type a 31st character, then it is not added.

**Very large and very small numbers**
- **S-5.21** Given I enter `1e15` as a person's amount, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-5.22** Given I enter `1000000000000000` as a person's amount, when I leave the field, then I see "Amount can't be more than 1,000,000.00."
- **S-5.23** Given I enter `0.001` as a person's amount, when I leave the field, then I see "Use at most 2 decimal places."
- **S-5.24** Given I paste a 100-character name, when I look at the field, then only the first 30 characters are kept.

**Carrying on after a result or an error**
- **S-5.25** Given subtotal `100`, tax `16` and "10%", rows Ali `60` and Sara `40`, and a third row showing an error, when I remove the third row, then the error disappears and results appear with Ali owing 75.60 and Sara owing 50.40.
- **S-5.26** Given Sara's row shows "Amount can't be negative.", when I correct her amount to `40`, then the error disappears as I type and results appear.
- **S-5.27** Given I am on "Split by order", when I press "Reset", then the reset described in the shared definitions applies and "Split by order" stays selected.

**Found in QA testing (added 18 Oct 2026)**
- **S-5.28** Given three unnamed rows with amounts `10`, `20` and `30`, when I double-click "Remove" on the first row, then only that row is removed, and the remaining rows are "Person 1" with `20` and "Person 2" with `30`.
- **S-5.29** Given the page is 360px wide, when I give a person a 30-letter name with no spaces, then the name wraps onto more lines and the page does not scroll sideways.

### S-6: See what each person owes, with tax and tip shared in proportion
**Serves:** J-3 · **Role:** Bill Organiser · **Status:** Implemented · **Planned for:** v1

As a Bill Organiser, I want to see what each person owes, made up of their order plus a share of tax, charges and tip in proportion to their order, so that nobody pays for someone else's food.

How shares are worked out:
- Each person's share of tax and tip is their ordered amount divided by the total of all ordered amounts, multiplied by tax plus tip.
- Each share is rounded down to the cent.
- Leftover cents go one at a time to the people with the largest remainders. Ties go to the person higher in the list.

**Normal case**
- **S-6.1** Given subtotal `100`, tax `16` and "10%", and Ali ordered `60` and Sara ordered `40`, when results appear, then:
  - Ali: Ordered 60.00, Share of tax and tip 15.60, Owes 75.60
  - Sara: Ordered 40.00, Share of tax and tip 10.40, Owes 50.40
  - the total row shows 126.00 and "Matches the receipt total."
- **S-6.2** Given subtotal `30`, tax `1` and "0%", and three unnamed rows each ordered `10`, when results appear, then Person 1 owes 10.34, Person 2 owes 10.33 and Person 3 owes 10.33. The total row shows 31.00, and the tie goes to the person higher in the list.

**Invalid input**
- **S-6.3** Given the normal case is shown, when I change the subtotal to `abc`, then no amounts owed are shown and the results area says "Fix the highlighted fields to see the split."
- **S-6.4** Given the normal case is shown, when I paste `Rs 60` as Ali's amount and leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50." on Ali's row and no amounts owed are shown.

**Boundary values**
- **S-6.5** Given subtotal `100`, tax empty and "0%", and Ali ordered `60` and Sara ordered `40`, when results appear, then Ali owes 60.00 and Sara owes 40.00, with Share of tax and tip 0.00 for each.
- **S-6.6** Given one row whose amount equals subtotal `100`, with tax `16` and "10%", when results appear, then that person owes 126.00.
- **S-6.7** Given subtotal `100`, tax empty and "15%", and Person 1 ordered `0.01` and Person 2 ordered `99.99`, when results appear, then:
  - Person 1: Share of tax and tip 0.00, Owes 0.01
  - Person 2: Share of tax and tip 15.00, Owes 114.99
  - the total row shows 115.00. The leftover cent goes to the person with the larger remainder.
- **S-6.8** Given subtotal `0.50`, tax `0.01` and "0%", and 50 unnamed rows each ordered `0.01`, when results appear, then Person 1 owes 0.02, Persons 2 to 50 each owe 0.01, and the total row shows 0.51.

**Very large and very small numbers**
- **S-6.9** Given subtotal `1000000`, tax `1000000` and custom tip `100`, and Person 1 ordered `999999.99` and Person 2 ordered `0.01`, when results appear, then:
  - Person 1: Share of tax and tip 1,999,999.98, Owes 2,999,999.97
  - Person 2: Share of tax and tip 0.02, Owes 0.03
  - the total row shows 3,000,000.00 and "Matches the receipt total."
- **S-6.10** Given subtotal `960811.70`, tax `459405.35` and custom tip `100`, and Person 1 ordered `864730.53` and Person 2 ordered `96081.17`, when results appear, then:
  - Person 1: Share of tax and tip 1,278,195.35, Owes 2,142,925.88
  - Person 2: Share of tax and tip 142,021.70, Owes 238,102.87
  - the total row shows 2,381,028.75 and "Matches the receipt total."

  Both shares end in exactly half a cent, so the leftover cent goes to Person 1, the higher in the list. Ordinary JavaScript numbers give it to Person 2 (2,142,925.87 and 238,102.88), and the total still matches, so only this check catches the error.
- **S-6.11** Given subtotal `0.03`, tax `0.01` and "0%", and three unnamed rows each ordered `0.01`, when results appear, then Person 1 owes 0.02, Person 2 owes 0.01 and Person 3 owes 0.01, and the total row shows 0.04.

**Carrying on after a result or an error**
- **S-6.12** Given the normal case is shown, when I change Ali's amount to `50` and Sara's to `50`, then:
  - each has Share of tax and tip 13.00 and Owes 63.00
  - the total row shows 126.00 with "Matches the receipt total."
- **S-6.13** Given subtotal `30`, tax `1` and "0%", with three unnamed rows each `10`, when I remove the second row, then:
  - Person 1 and Person 2 each have Share of tax and tip 0.50 and Owe 10.50
  - the total row shows 21.00
  - the S-7 warning appears: "The amounts entered add up to 20.00, but the receipt subtotal is 30.00. 10.00 is not assigned to anyone."
- **S-6.14** Given the normal case is shown, when I change Ali's amount to `abc`, then all amounts owed disappear straight away. When I correct it to `60`, then Ali owes 75.60 and Sara owes 50.40 again.

### S-7: Be warned when the amounts don't cover the bill
**Serves:** J-4 · **Role:** Bill Organiser · **Status:** Implemented · **Planned for:** v1

As a Bill Organiser, I want a clear warning when the ordered amounts don't add up to the receipt subtotal, so that I don't collect too little or too much without knowing.

**Normal case**
- **S-7.1** Given subtotal `100`, tax `16` and "10%", and Ali ordered `60` and Sara ordered `30`, when results appear, then:
  - I see "The amounts entered add up to 90.00, but the receipt subtotal is 100.00. 10.00 is not assigned to anyone."
  - the amounts owed are still shown: Ali 77.33, Sara 38.67
  - the total row shows 116.00 and "10.00 less than the receipt total of 126.00."
- **S-7.2** Given subtotal `100`, tax `16` and "10%", and Ali ordered `60` and Sara ordered `50`, when results appear, then:
  - I see "The amounts entered add up to 110.00, which is 10.00 more than the receipt subtotal of 100.00. Check for an item entered twice."
  - the amounts owed are Ali 74.18 and Sara 61.82
  - the total row shows 136.00 and "10.00 more than the receipt total of 126.00."
- **S-7.3** Given the ordered amounts add up exactly to the subtotal, when results appear, then no warning is shown and the total row shows "Matches the receipt total."

**Invalid input**
- **S-7.4** Given the first normal case is shown with its warning, when I change Sara's amount to `abc`, then the warning and all amounts owed disappear straight away, and the results area says "Fix the highlighted fields to see the split."

**Boundary values**
- **S-7.5** Given subtotal `100`, tax empty and "0%", and people ordered `60` and `39.99`, when results appear, then:
  - I see "The amounts entered add up to 99.99, but the receipt subtotal is 100.00. 0.01 is not assigned to anyone."
  - the total row shows 99.99 and "0.01 less than the receipt total of 100.00."
- **S-7.6** Given people ordered `60` and `40` against subtotal `100`, when results appear, then no warning is shown, because the difference is 0.00.

**Very large and very small numbers**
- **S-7.7** Given subtotal `1000000`, tax empty and "0%", and two people each ordered `1000000`, when results appear, then:
  - I see "The amounts entered add up to 2,000,000.00, which is 1,000,000.00 more than the receipt subtotal of 1,000,000.00. Check for an item entered twice."
  - the total row shows 2,000,000.00 and "1,000,000.00 more than the receipt total of 1,000,000.00."
- **S-7.8** Given subtotal `0.02`, tax empty and "0%", and one person ordered `0.01`, when results appear, then:
  - I see "The amounts entered add up to 0.01, but the receipt subtotal is 0.02. 0.01 is not assigned to anyone."
  - the total row shows 0.01 and "0.01 less than the receipt total of 0.02."

**Carrying on after a result or an error**
- **S-7.9** Given the first normal case is shown with its warning, when I change Sara's amount to `40`, then the warning disappears, Ali owes 75.60, Sara owes 50.40, and the total row shows 126.00 with "Matches the receipt total."
- **S-7.10** Given subtotal `100`, tax `16` and "10%", with three people who ordered `50`, `30` and `20` and no warning, when I remove the third person, then:
  - I see "The amounts entered add up to 80.00, but the receipt subtotal is 100.00. 20.00 is not assigned to anyone."
  - the amounts owed are 66.25 and 39.75
  - the total row shows 106.00 and "20.00 less than the receipt total of 126.00."
- **S-7.11** Given the first normal case is shown with its warning, when I change the subtotal to `95`, then:
  - I see "The amounts entered add up to 90.00, but the receipt subtotal is 95.00. 5.00 is not assigned to anyone."
  - the tip is 9.50, the amounts owed are 77.00 and 38.50
  - the total row shows "5.00 less than the receipt total of 120.50."
- **S-7.12** When I then change the subtotal to `90`, then:
  - the warning disappears
  - the tip is 9.00, the amounts owed are 76.67 and 38.33
  - the total row shows 115.00 with "Matches the receipt total."

### S-8: Split a shared item between several people
**Serves:** J-3 · **Role:** Bill Organiser · **Status:** Not implemented · **Planned for:** Backlog

As a Bill Organiser, I want to enter an item that several people shared and choose who shared it, so that its cost is split between just those people.

How shared items work:
- A shared item has an amount field and one tick box per person.
- Its amount follows the money input rules.
- Its cost is split evenly between the people ticked. Leftover cents go to the people higher in the list.
- Each person's part is added to their ordered amount before tax and tip are shared out, and it counts towards the S-7 check.

> **Change to S-5 when this story is built.** A person who is ticked on at least one shared item may leave their own "Ordered" field empty, which then counts as 0.00. For everyone else, S-5's rule still applies.

**Normal case**
- **S-8.1** Given a shared item of `90` ticked for Ali, Sara and Omar, when results appear, then each has 30.00 added to their ordered amount.
- **S-8.2** Given a shared item of `100` ticked for Ali, Sara and Omar, in that list order, when results appear, then Ali gets 33.34, and Sara and Omar each get 33.33.

**Invalid input**
- **S-8.3** Given I click into a shared item's amount and leave it empty, or enter `0`, when I leave the field, then I see "Enter the shared item's amount (at least 0.01)."
- **S-8.4** Given I enter a shared item's amount as `abc`, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-8.5** Given I enter a shared item's amount as `Rs 90`, when I leave the field, then I see "Remove commas and currency symbols, e.g. 1250.50."
- **S-8.6** Given I enter a shared item's amount as `-90`, when I leave the field, then I see "Amount can't be negative."
- **S-8.7** Given a shared item of `90` with no one ticked, when I leave the item, then I see "Choose at least one person who shared this item." under it and no results are shown.

**Boundary values**
- **S-8.8** Given a shared item of `90` ticked for 1 person, when results appear, then that person gets 90.00.
- **S-8.9** Given a shared item of `50` ticked for all 50 people, when results appear, then each gets 1.00.
- **S-8.10** Given a shared item of `1000000.01`, when I leave the field, then I see "Amount can't be more than 1,000,000.00."

**Very large and very small numbers**
- **S-8.11** Given a shared item of `1000000` ticked for 3 people, when results appear, then they get 333,333.34, 333,333.33 and 333,333.33.
- **S-8.12** Given a shared item of `0.01` ticked for 3 people, when results appear, then they get 0.01, 0.00 and 0.00.
- **S-8.13** Given a shared item of `1e15`, when I leave the field, then I see "Enter an amount using digits and an optional decimal point, e.g. 1250.50."
- **S-8.14** Given a shared item of `0.001`, when I leave the field, then I see "Use at most 2 decimal places."

**Carrying on after a result or an error**
- **S-8.15** Given a shared item of `90` ticked for Ali, Sara and Omar, when I remove Omar from the list, then Ali and Sara each get 45.00 of it.
- **S-8.16** Given a shared item ticked only for Ali, when I remove Ali, then I see "Choose at least one person who shared this item."
- **S-8.17** Given subtotal `100`, Ali ordered `40`, Sara's own amount is empty, and a shared item of `60` is ticked for Ali and Sara, when results appear, then:
  - Ali's "Ordered" column shows 70.00 and Sara's shows 30.00
  - no S-7 warning is shown, because the amounts add up to 100.00

### S-9: Copy a summary of who owes what
**Serves:** J-5 · **Role:** Bill Organiser · **Status:** Not implemented · **Planned for:** Backlog

As a Bill Organiser, I want to copy a plain-text summary of who owes what, so that I can paste it into the group chat.

**Normal case**
- **S-9.1** Given the S-6 normal case is shown (Ali 75.60, Sara 50.40), when I press "Copy summary", then:
  - the clipboard contains exactly three lines: "Ali: 75.60", "Sara: 50.40" and "Total: 126.00"
  - I see "Copied." next to the control

**Invalid input**
- **S-9.2** Given any input is invalid, when I look at "Copy summary", then it is disabled.
- **S-9.3** Given a person is named `Khan, Ali` and owes 75.60, when I copy, then their line reads "Khan, Ali: 75.60".
- **S-9.4** Given the S-7 first normal case is shown, when I copy, then the summary's last line is "The amounts entered add up to 90.00, but the receipt subtotal is 100.00. 10.00 is not assigned to anyone."

**Boundary values**
- **S-9.5** Given 1 person, when I copy, then the summary has one person line and the total line.
- **S-9.6** Given 50 people, when I copy, then the summary has 50 person lines and the total line.
- **S-9.7** Given a 30-character name, when I copy, then the full name appears.

**Very large and very small numbers**
- **S-9.8** Given the S-6 large case is shown, when I copy, then the summary is "Person 1: 2,999,999.97", "Person 2: 0.03" and "Total: 3,000,000.00".

**Carrying on after a result or an error**
- **S-9.9** Given I have copied the S-6 normal case, when I change Ali's and Sara's amounts to `50` each and copy again, then the clipboard contains "Ali: 63.00", "Sara: 63.00" and "Total: 126.00".
- **S-9.10** Given the browser blocks clipboard access, when I press "Copy summary", then:
  - I see "Couldn't copy automatically. Select the text below and copy it."
  - the summary appears in a text box with all its text already selected
