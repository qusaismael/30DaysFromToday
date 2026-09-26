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
