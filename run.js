import { chromium } from 'playwright';
import fs from 'fs';

const games = [
  'https://www.linkedin.com/games/pinpoint/',
  'https://www.linkedin.com/games/crossclimb/',
  'https://www.linkedin.com/games/zip/',
  'https://www.linkedin.com/games/tango/',
  'https://www.linkedin.com/games/queens/',
  'https://www.linkedin.com/games/mini-sudoku/',
  'https://www.linkedin.com/games/patches/'
];

const solverScript = fs.readFileSync('./solver.js', 'utf8');

(async () => {

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    storageState: 'cookies.json'
  });

  const page = await context.newPage();

  for (const game of games) {

    console.log('Opening:', game);

    await page.goto(game, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    await page.waitForTimeout(5000);

    await page.addScriptTag({
      content: solverScript
    });

    await page.waitForTimeout(8000);

    console.log('Solved:', game);
  }

  await browser.close();

})();
