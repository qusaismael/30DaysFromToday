const { test, expect } = require('@playwright/test');

test.describe('Pacific local dates', () => {
  test.use({ timezoneId: 'America/Los_Angeles' });
  test('local start date', async ({ page }) => {
    await page.goto('/');
    await page.locator('#startDate').fill('2026-01-01');
    await page.locator('#monthBtn').click();
    await expect(page.locator('#endDate')).toContainText('January 31, 2026');
  });
});

test.describe('New York DST', () => {
  test.use({ timezoneId: 'America/New_York' });
  test('DST day count', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-11-01T16:00:00Z') });
    await page.goto('/');
    await page.locator('#startDate').fill('2026-11-01');
    await page.locator('#customDays').fill('1');
    await page.locator('#customBtn').click();
    await expect(page.locator('#daysCount')).toHaveText('1 days from now');
  });
});

test('fractional days are rejected instead of rounded', async ({ page }) => {
  await page.goto('/');
  await page.locator('#customDays').fill('2.5');
  await page.locator('#customBtn').click();
  await expect(page.locator('#resultCard')).toBeHidden();
  await expect(page.locator('#notification')).toContainText('valid number of days');
});

for (const width of [390, 320]) {
  test(`custom duration controls fit a ${width}px phone`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 844 });
    await page.goto('/');
    const layout = await page.evaluate(() => {
      const input = document.querySelector('#customDays').getBoundingClientRect();
      const button = document.querySelector('#customBtn').getBoundingClientRect();
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        viewport: document.documentElement.clientWidth,
        inputLeft: input.left,
        inputRight: input.right,
        buttonLeft: button.left,
        buttonRight: button.right,
        buttonHeight: button.height
      };
    });
    expect(layout.overflow).toBeLessThanOrEqual(0);
    expect(layout.inputLeft).toBeGreaterThanOrEqual(0);
    expect(layout.inputRight).toBeLessThanOrEqual(layout.viewport);
    expect(layout.buttonLeft).toBeGreaterThanOrEqual(0);
    expect(layout.buttonRight).toBeLessThanOrEqual(layout.viewport);
    expect(layout.buttonHeight).toBeGreaterThanOrEqual(44);
  });
}

test('calculated date is announced outside the hidden result card', async ({ page }) => {
  await page.goto('/');
  const status = page.getByRole('status');
  await expect(status).toBeEmpty();
  await page.locator('#monthBtn').focus();
  await page.keyboard.press('Enter');
  await expect(status).toContainText(await page.locator('#endDate').textContent());
});

test('reduced motion removes result animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('#monthBtn').click();
  const animation = await page.locator('#resultCard').evaluate(el => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});

test('copy and calendar actions use the selected local date', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true,
      value: { writeText: async text => { window.copiedText = text; } } });
    window.open = url => { window.calendarUrl = url; };
  });
  await page.goto('/');
  await page.locator('#startDate').fill('2026-01-01');
  await page.locator('#monthBtn').click();
  await page.locator('#copyBtn').click();
  expect(await page.evaluate(() => window.copiedText)).toBe('Subscription End Date: Saturday, January 31, 2026');
  await page.locator('#addCalendarBtn').click();
  const url = await page.evaluate(() => window.calendarUrl);
  expect(new URL(url).searchParams.get('dates')).toBe('20260131/20260131');
  await expect(page.locator('#notification')).toContainText('Opening calendar...');
});
