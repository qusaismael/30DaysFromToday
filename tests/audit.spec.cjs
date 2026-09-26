const { test } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

// Opt-in local QA captures; not part of the behavioral suite.
test.skip(!process.env.SITE_CAPTURE_TAG, 'Run with SITE_CAPTURE_TAG=before|after');

for (const [name, width, height] of [['desktop', 1440, 900], ['phone', 390, 844], ['small-phone', 320, 568]]) {
  test(`${name} rendered layout`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    const focus = [];
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      focus.push(await page.evaluate(() => document.activeElement.id));
    }
    const collect = () => page.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      smallTargets: [...document.querySelectorAll('button,input,a')]
        .filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0)
        .filter(el => el.getBoundingClientRect().width < 44 || el.getBoundingClientRect().height < 44)
        .map(el => ({ id: el.id, width: Math.round(el.getBoundingClientRect().width), height: Math.round(el.getBoundingClientRect().height) })),
      images: [...document.images].map(img => ({ src: img.getAttribute('src'), loaded: img.complete && img.naturalWidth > 0 })),
      resultRole: document.getElementById('resultCard').getAttribute('role'),
      resultLive: document.getElementById('resultCard').getAttribute('aria-live')
    }));
    const initial = await collect();
    const out = path.join(__dirname, '..', 'preview');
    fs.mkdirSync(out, { recursive: true });
    await page.screenshot({ path: path.join(out, `${process.env.SITE_CAPTURE_TAG}-${name}.jpg`), type: 'jpeg', quality: 65, fullPage: true });
    await page.locator('#monthBtn').click();
    await page.waitForTimeout(650);
    const result = await collect();
    await page.screenshot({ path: path.join(out, `${process.env.SITE_CAPTURE_TAG}-${name}-result.jpg`), type: 'jpeg', quality: 65, fullPage: true });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const reducedAnimation = await page.locator('#resultCard').evaluate(el => getComputedStyle(el).animationName);
    console.log(JSON.stringify({ name, initial, result, focus, reducedAnimation, errors }));
  });
}
