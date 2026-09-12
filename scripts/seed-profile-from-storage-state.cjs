'use strict';

// Seed a Chromium persistent profile from a Playwright storageState JSON file.
// The state file must be supplied locally/through a GitHub Secret; never commit it.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const statePath = path.resolve('linkedin-storage-state.json');
const profileDir = path.resolve('upstream/service/data/profile');

if (!fs.existsSync(statePath)) {
  throw new Error(`Missing ${statePath}`);
}

const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
if (!Array.isArray(state.cookies)) {
  throw new Error('storageState JSON does not contain a cookies array.');
}

fs.mkdirSync(profileDir, { recursive: true, mode: 0o700 });

(async () => {
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: 'chromium',
    headless: true,
    viewport: { width: 1360, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    timeout: 60000,
  });

  await context.addCookies(state.cookies);
  if (Array.isArray(state.origins)) {
    for (const origin of state.origins) {
      const page = await context.newPage();
      try {
        await page.goto(origin.origin, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (Array.isArray(origin.localStorage)) {
          await page.evaluate((entries) => {
            for (const entry of entries) localStorage.setItem(entry.name, entry.value);
          }, origin.localStorage);
        }
      } catch (_) {
        // Cookies are the important part; unavailable origins can be ignored.
      } finally {
        await page.close();
      }
    }
  }

  await context.close();
  console.log('Authenticated Chromium profile seeded.');
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
