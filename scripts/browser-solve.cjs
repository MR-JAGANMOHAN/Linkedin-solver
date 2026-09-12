'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(path.resolve('upstream/service/node_modules/playwright'));

const PROFILE_DIR = path.resolve('upstream/service/data/profile');
const EXTENSION_DIR = path.resolve('upstream');
const REPORT_DIR = path.resolve('upstream/service/data/browser-run');
const REPORT_PATH = path.join(REPORT_DIR, 'report.json');
const SCREENSHOT_DIR = path.join(REPORT_DIR, 'screenshots');

const games = [
  ['queens', 'Queens'],
  ['tango', 'Tango'],
  ['zip', 'Zip'],
  ['mini-sudoku', 'Mini Sudoku'],
  ['patches', 'Patches'],
  ['pinpoint', 'Pinpoint'],
  ['crossclimb', 'Crossclimb'],
  ['wend', 'Wend'],
];

const results = [];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isAuthFailure(url) {
  return /\/login|\/checkpoint|\/uas\/login/i.test(url);
}

function isCompletedUrl(url) {
  try {
    return /\/games\/[^/]+\/results\/?$/i.test(new URL(url).pathname);
  } catch {
    return false;
  }
}

async function completedInFrame(frame) {
  try {
    if (/\/results\/?$/i.test(new URL(frame.url()).pathname)) return true;
  } catch {}
  try {
    return await frame.locator('a,button').evaluateAll(elements => elements.some(el =>
      !el.closest('#linkedin-logic-solver') && (el.textContent || '').trim() === 'See results'));
  } catch {
    return false;
  }
}

async function pageCompleted(page) {
  if (isCompletedUrl(page.url())) return true;
  for (const frame of page.frames()) {
    if (await completedInFrame(frame)) return true;
  }
  return false;
}

async function findSolverFrame(page, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const panel = frame.locator('#linkedin-logic-solver');
        if (await panel.count()) return frame;
      } catch {}
    }
    await sleep(250);
  }
  throw new Error('The upstream extension did not inject its solver panel into this game page.');
}

async function clickStartGame(page, label) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    for (const frame of page.frames()) {
      try {
        const buttons = frame.locator('button');
        const count = await buttons.count();
        for (let i = 0; i < count; i += 1) {
          const button = buttons.nth(i);
          const text = (await button.textContent() || '').trim().replace(/\s+/g, ' ');
          if (/^start game$/i.test(text) && await button.isVisible()) {
            console.log(`${label}: clicking Start game.`);
            await button.click();
            await sleep(1200);
            return true;
          }
        }
      } catch {}
    }
    await sleep(250);
  }
  return false;
}

async function waitForCompletion(page, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await pageCompleted(page)) return true;

    for (const frame of page.frames()) {
      try {
        const status = frame.locator('#linkedin-logic-solver .lls__status');
        if (await status.count()) {
          const text = (await status.first().textContent() || '').trim();
          if (/verified after reload|already completed/i.test(text)) return true;
          if (/error/i.test(text)) throw new Error(`Extension reported an error: ${text}`);
        }
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('Extension reported an error:')) throw error;
      }
    }

    await sleep(500);
  }
  return false;
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    channel: 'chromium',
    headless: false,
    viewport: { width: 1360, height: 800 },
    locale: 'en-US',
    timezoneId: 'America/Los_Angeles',
    timeout: 60000,
    args: [
      `--disable-extensions-except=${EXTENSION_DIR}`,
      `--load-extension=${EXTENSION_DIR}`,
      '--disable-dev-shm-usage',
    ],
  });

  context.setDefaultTimeout(15000);

  const extensionInfo = {
    loaded: false,
    serviceWorker: null,
  };
  extensionInfo.loaded = context.serviceWorkers().length > 0;
  extensionInfo.serviceWorker = context.serviceWorkers()[0]?.url() || null;

  const page = await context.newPage();
  page.on('console', msg => console.log(`[browser:${msg.type()}] ${msg.text()}`));
  page.on('pageerror', error => console.log(`[browser:pageerror] ${error.message}`));

  try {
    for (const [slug, label] of games) {
      const startedAt = Date.now();
      const entry = { game: slug, label, ok: false, alreadyCompleted: false, durationMs: 0, url: null, error: null };

      try {
        const target = `https://www.linkedin.com/games/${slug}/`;
        console.log(`\n=== ${label} ===`);
        console.log(`Opening ${target}`);
        await page.goto(target, { waitUntil: 'domcontentloaded', timeout: 60000 });
        entry.url = page.url();

        if (isAuthFailure(page.url())) {
          throw new Error(`LinkedIn authentication failed; redirected to ${page.url()}`);
        }

        const alreadyCompleted = await pageCompleted(page);
        entry.alreadyCompleted = alreadyCompleted;
        if (alreadyCompleted) {
          entry.ok = true;
          console.log(`${label}: already completed.`);
          results.push(entry);
          continue;
        }

        // LinkedIn's game landing page can show a Start game button before the
        // actual puzzle state exists. The extension's solver requires the board
        // to be started/loaded first.
        await clickStartGame(page, label);

        const solverFrame = await findSolverFrame(page, 20000);
        const solverButton = solverFrame.locator('#linkedin-logic-solver .lls__solve');
        await solverButton.waitFor({ state: 'visible', timeout: 15000 });

        console.log(`${label}: clicking Solve by request.`);
        await solverButton.click();

        const completed = await waitForCompletion(page, 75000);
        entry.url = page.url();
        if (!completed) {
          throw new Error(`Solve request finished without a verified completion state. Final URL: ${page.url()}`);
        }

        entry.ok = true;
        console.log(`${label}: completion verified. URL=${page.url()}`);
      } catch (error) {
        entry.url = page.url();
        entry.error = error instanceof Error ? error.message : String(error);
        console.error(`${label}: FAILED — ${entry.error}`);
        try {
          await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${slug}.png`), fullPage: true });
        } catch {}
      } finally {
        entry.durationMs = Date.now() - startedAt;
        results.push(entry);
        await sleep(1000);
      }
    }
  } finally {
    const report = {
      generatedAt: new Date().toISOString(),
      extension: extensionInfo,
      games: results,
      totals: {
        attempted: results.length,
        passed: results.filter(r => r.ok).length,
        failed: results.filter(r => !r.ok).length,
      },
    };
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
    console.log(`\nREPORT ${REPORT_PATH}`);
    console.log(JSON.stringify(report.totals));
    await context.close();
  }

  if (results.some(result => !result.ok)) process.exit(1);
})().catch(error => {
  console.error(`FATAL: ${error instanceof Error ? error.stack || error.message : String(error)}`);
  process.exit(1);
});
