// The UI. It keeps the form's state, runs every change through the engine,
// and copies the engine's output onto the page. It does no arithmetic and
// contains no message text: every string shown comes from src/lib (D-19, D-25).
//
// Rules from the technical plan:
// - A field the user is typing in is never recreated (D-21). Inputs are
//   written from state only on page load and on Reset; rows are created or
//   removed only when a person is added or removed.
// - Every string goes onto the page with textContent, never as HTML (D-24).

import { initialState, compute, resetState, addRow, removeRow, editField, leaveField } from './lib/engine.js';

const byId = (id) => document.getElementById(id);

const form = byId('form');
const inputs = {
  subtotal: byId('subtotal'),
  tax: byId('tax'),
  customTip: byId('customTip'),
  people: byId('people'),
};
const rowList = byId('rows');
const rowTemplate = byId('row-template');
const rowElements = new Map(); // row id → { item, label, name, ordered, remove, error }

let state = initialState();

// ---------------------------------------------------------------- events

// Pressing Enter in a field must not submit the form and reload the page.
form.addEventListener('submit', (event) => event.preventDefault());

// Any change to a field's value updates the results, however it was made (D-35).
// Typing, pasting and undo send "input"; some autofill tools and password
// managers send only "change"; and the value is read again when the field is
// left, so the results can never disagree with what the field shows.
for (const [key, input] of Object.entries(inputs)) {
  input.addEventListener('input', () => edit(key, input.value));
  input.addEventListener('change', () => edit(key, input.value));
  input.addEventListener('blur', () => leave(key, input.value));
}

for (const radio of form.elements.mode) {
  radio.addEventListener('change', () => update({ mode: radio.value }));
}

for (const radio of form.elements.tip) {
  radio.addEventListener('change', () => update({ tipChoice: radio.value }));
}

byId('add-row').addEventListener('click', () => {
  state = addRow(state);
  render();
  const newest = state.rows[state.rows.length - 1];
  rowElements.get(newest.id)?.name.focus();
});

byId('reset').addEventListener('click', () => {
  state = resetState(state);
  writeInputsFromState();
  render();
});

// ---------------------------------------------------------------- state changes

function update(changes) {
  state = { ...state, ...changes };
  render();
}

function edit(key, value) {
  state = editField(state, key, value);
  render();
}

/** The user left a field: store its current value, then mark it as left. */
function leave(key, value) {
  state = leaveField(editField(state, key, value), key);
  render();
}

function updateRow(id, changes) {
  state = { ...state, rows: state.rows.map((row) => (row.id === id ? { ...row, ...changes } : row)) };
  render();
}

function removeRowAndMoveFocus(id) {
  const index = state.rows.findIndex((row) => row.id === id);
  state = removeRow(state, id);
  render();
  // Keep keyboard users in the list: focus the row that took this one's place,
  // or the one before it if the last row was removed.
  const next = state.rows[Math.min(index, state.rows.length - 1)];
  rowElements.get(next.id)?.name.focus();
}

// ---------------------------------------------------------------- rows

function createRowElement(row) {
  const item = rowTemplate.content.firstElementChild.cloneNode(true);
  const label = item.querySelector('.row-label');
  const name = item.querySelector('.name');
  const ordered = item.querySelector('.ordered');
  const remove = item.querySelector('.remove');
  const error = item.querySelector('.error');

  label.id = `row-${row.id}-label`;
  name.id = `row-${row.id}-name`;
  ordered.id = `row-${row.id}-ordered`;
  error.id = `row-${row.id}-error`;
  item.querySelector('.name-label').htmlFor = name.id;
  item.querySelector('.ordered-label').htmlFor = ordered.id;
  name.setAttribute('aria-describedby', label.id);
  ordered.setAttribute('aria-describedby', `${label.id} ${error.id}`);

  name.value = row.name;
  ordered.value = row.ordered;

  for (const type of ['input', 'change', 'blur']) {
    name.addEventListener(type, () => updateRow(row.id, { name: name.value }));
  }
  ordered.addEventListener('input', () => edit(`ordered:${row.id}`, ordered.value));
  ordered.addEventListener('change', () => edit(`ordered:${row.id}`, ordered.value));
  ordered.addEventListener('blur', () => leave(`ordered:${row.id}`, ordered.value));
  // A double-click must remove only this row (D-34). After the first click
  // the next row moves up under the pointer, so the second click (event.detail
  // is 2) would otherwise remove that row too. Keyboard presses have detail 0.
  remove.addEventListener('click', (event) => {
    if (event.detail > 1) return;
    removeRowAndMoveFocus(row.id);
  });

  const elements = { item, label, name, ordered, remove, error };
  rowElements.set(row.id, elements);
  return elements;
}

/** Add elements for new rows and remove elements for removed rows. Existing rows are left alone. */
function syncRowElements() {
  const ids = new Set(state.rows.map((row) => row.id));
  for (const [id, elements] of rowElements) {
    if (!ids.has(id)) {
      elements.item.remove();
      rowElements.delete(id);
    }
  }
  for (const row of state.rows) {
    if (!rowElements.has(row.id)) rowList.append(createRowElement(row).item);
  }
}

/** Write every input from state. Only used on page load and on Reset. */
function writeInputsFromState() {
  for (const [key, input] of Object.entries(inputs)) input.value = state[key];
  for (const radio of form.elements.mode) radio.checked = radio.value === state.mode;
  for (const radio of form.elements.tip) radio.checked = radio.value === state.tipChoice;
  for (const elements of rowElements.values()) elements.item.remove();
  rowElements.clear();
  syncRowElements();
}

// ---------------------------------------------------------------- rendering

function showFieldStatus(input, errorElement, status) {
  input.setAttribute('aria-invalid', status.invalid ? 'true' : 'false');
  errorElement.textContent = status.message ?? '';
}

function render() {
  const output = compute(state);

  byId('even-section').hidden = state.mode !== 'even';
  byId('order-section').hidden = state.mode !== 'order';
  byId('custom-tip-field').hidden = state.tipChoice !== 'custom';

  for (const [key, input] of Object.entries(inputs)) {
    showFieldStatus(input, byId(`${key}-error`), output.fields[key]);
  }

  syncRowElements();
  for (const row of output.rows) {
    const elements = rowElements.get(row.id);
    elements.label.textContent = row.label;
    elements.remove.setAttribute('aria-label', `Remove ${row.label}`);
    elements.remove.disabled = !output.controls.canRemoveRow;
    showFieldStatus(elements.ordered, elements.error, row);
  }
  byId('add-row').disabled = !output.controls.canAddRow;
  byId('add-row-note').textContent = output.controls.addRowNote ?? '';

  renderResults(output);
}

function renderResults(output) {
  const message = byId('results-message');
  const receipt = byId('receipt');
  const split = byId('split');
  const warning = byId('warning');
  const tableWrap = byId('table-wrap');

  if (!output.results) {
    message.textContent = output.resultsMessage;
    receipt.hidden = split.hidden = warning.hidden = tableWrap.hidden = true;
    return;
  }

  const { results } = output;
  message.textContent = '';

  receipt.replaceChildren(
    ...results.receipt.flatMap(({ label, value }) => [element('dt', label), element('dd', value)]),
  );
  receipt.hidden = false;

  if (results.split) {
    split.replaceChildren(...results.split.map((line) => element('li', line)));
    split.hidden = false;
    warning.hidden = tableWrap.hidden = true;
    return;
  }

  split.hidden = true;
  warning.textContent = results.warning ?? '';
  warning.hidden = results.warning === null;

  // Column names for the stacked phone layout come from the table's own headings.
  const [, orderedHeading, shareHeading, owesHeading] = [...document.querySelectorAll('#table thead th')].map(
    (th) => th.textContent,
  );
  byId('table-body').replaceChildren(
    ...results.table.map((row) => {
      const tr = document.createElement('tr');
      const th = element('th', row.label);
      th.scope = 'row';
      tr.append(
        th,
        element('td', row.ordered, orderedHeading),
        element('td', row.share, shareHeading),
        element('td', row.owes, owesHeading),
      );
      return tr;
    }),
  );
  byId('total-amount').textContent = results.totalRow.amount;
  byId('total-note').textContent = results.totalRow.note;
  tableWrap.hidden = false;
}

/** Create an element with text content. `columnLabel` labels a cell when the table is stacked on phones. */
function element(tag, text, columnLabel) {
  const node = document.createElement(tag);
  node.textContent = text;
  if (columnLabel) {
    node.dataset.label = columnLabel;
    node.className = 'num';
  }
  return node;
}

// ---------------------------------------------------------------- start

writeInputsFromState();
render();
