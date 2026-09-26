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
