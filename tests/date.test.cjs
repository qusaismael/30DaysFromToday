const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadCalculator({ now, zone, start, custom = '', reducedMotion = false }) {
  process.env.TZ = zone;
  const elements = Object.fromEntries([
    'startDate', 'customDays', 'resultCard', 'endDate', 'durationInfo',
    'daysCount', 'startLabel', 'endLabel', 'notification', 'resultAnnouncement'
  ].map(id => [id, { value: '', textContent: '', style: {}, classList: { add() {}, remove() {} }, scrollIntoView() {} }]));
  elements.startDate.value = start;
  elements.customDays.value = custom;
  elements.resultCard.style.display = 'none';
  elements.resultCard.scrollIntoView = options => { elements.resultCard.scrollOptions = options; };
  class FixedDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return new Date(now).getTime(); }
  }
  const context = vm.createContext({
    Date: FixedDate,
    document: { getElementById: id => elements[id], addEventListener() {} },
    window: { matchMedia: () => ({ matches: reducedMotion }) },
    setTimeout(fn) { fn(); }
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

test('fractional custom days are rejected without showing a result', () => {
  const { context, elements } = loadCalculator({
    zone: 'UTC', now: '2026-01-01T12:00:00Z', start: '2026-01-01', custom: '2.5'
  });
  context.calculateCustom();
  assert.equal(elements.resultCard.style.display, 'none');
  assert.match(elements.notification.textContent, /valid number of days/);
});

test('completed result has a persistent screen-reader announcement', () => {
  const { context, elements } = loadCalculator({
    zone: 'UTC', now: '2026-01-01T12:00:00Z', start: '2026-01-01'
  });
  context.calculateEndDate(30);
  assert.match(elements.resultAnnouncement.textContent, /January 31, 2026.*30 days from now/);
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /id="resultAnnouncement"[^>]*role="status"[^>]*aria-live="polite"/);
});

test('reduced motion avoids smooth result scrolling and entrance animation', () => {
  const { context, elements } = loadCalculator({
    zone: 'UTC', now: '2026-01-01T12:00:00Z', start: '2026-01-01', reducedMotion: true
  });
  context.calculateEndDate(30);
  assert.equal(elements.resultCard.scrollOptions.behavior, 'auto');
  const css = fs.readFileSync(require.resolve('../style.css'), 'utf8');
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.result-card[^}]*animation:\s*none/);
});

test('one-year preset remains exactly 365 days in a leap year', () => {
  const { context, elements } = loadCalculator({
    zone: 'UTC', now: '2024-01-01T12:00:00Z', start: '2024-01-01'
  });
  context.calculateEndDate(365);
  assert.match(elements.endDate.textContent, /December 31, 2024/);
  assert.equal(elements.durationInfo.textContent, '1 Year Subscription');
  assert.equal(context.window.currentResult.days, 365);
});
