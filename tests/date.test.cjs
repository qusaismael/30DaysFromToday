const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadCalculator({ now, zone, start, custom = '' }) {
  process.env.TZ = zone;
  const elements = Object.fromEntries([
    'startDate', 'customDays', 'resultCard', 'endDate', 'durationInfo',
    'daysCount', 'startLabel', 'endLabel', 'notification'
  ].map(id => [id, { value: '', textContent: '', style: {}, classList: { add() {}, remove() {} }, scrollIntoView() {} }]));
  elements.startDate.value = start;
  elements.customDays.value = custom;
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return new Date(now).getTime(); }
  }
  const context = vm.createContext({
    Date: FixedDate,
    document: { getElementById: id => elements[id], addEventListener() {} },
    window: {},
    setTimeout() {}
  });
  vm.runInContext(fs.readFileSync(require.resolve('../script.js'), 'utf8'), context);
  return { context, elements };
}

test('a fall DST transition counts one calendar day, not two elapsed-day units', () => {
  const { context, elements } = loadCalculator({
    zone: 'America/New_York', now: '2026-11-01T16:00:00Z', start: '2026-11-01'
  });
  context.calculateEndDate(1);
  assert.match(elements.endDate.textContent, /November 2, 2026/);
  assert.equal(elements.daysCount.textContent, '1 days from now');
});
