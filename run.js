import { chromium } from 'playwright';
import fs from 'fs';

const games = [
  {
    name: 'Pinpoint',
    url: 'https://www.linkedin.com/games/pinpoint/'
  },
  {
    name: 'Crossclimb',
    url: 'https://www.linkedin.com/games/crossclimb/'
  },
  {
    name: 'ZIP',
    url: 'https://www.linkedin.com/games/zip/'
  },
  {
    name: 'Tango',
    url: 'https://www.linkedin.com/games/tango/'
  },
  {
    name: 'Queens',
    url: 'https://www.linkedin.com/games/queens/'
  },
  {
    name: 'Mini Sudoku',
    url: 'https://www.linkedin.com/games/mini-sudoku/'
  },
  {
    name: 'Patches',
    url: 'https://www.linkedin.com/games/patches/'
  }
];

(async () => {

  console.log('Launching Chromium...');

  const browser = await chromium.launch({
    headless: true
  });

  const context = await browser.newContext({
    storageState: 'cookies.json'
  });

  //////////////////////////////////////////////////////
  // LOAD SOLVER BEFORE ANY PAGE LOADS
  //////////////////////////////////////////////////////

  const solverScript =
    fs.readFileSync('./solver.js', 'utf8');

  await context.addInitScript({
    content: solverScript
  });

  //////////////////////////////////////////////////////
  // SINGLE PAGE REUSE
  //////////////////////////////////////////////////////

  const page =
    await context.newPage();

  //////////////////////////////////////////////////////
  // PROCESS GAMES
  //////////////////////////////////////////////////////

  for (const game of games) {

    try {

      console.log('\n==============================');
      console.log('Opening:', game.name);
      console.log(game.url);

      ////////////////////////////////////////////////////
      // NAVIGATE
      ////////////////////////////////////////////////////

      await page.goto(
        game.url,
        {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        }
      );

      console.log('Page loaded');

      ////////////////////////////////////////////////////
      // WAIT FOR LINKEDIN JS
      ////////////////////////////////////////////////////

      await page.waitForTimeout(10000);

      ////////////////////////////////////////////////////
      // CHECK IF ALREADY SOLVED
      ////////////////////////////////////////////////////

      const bodyText =
        await page.textContent('body');

      const alreadySolved =
        bodyText?.includes('See puzzle') ||
        bodyText?.includes('See results');

      if (alreadySolved) {

        console.log(
          'Already solved:',
          game.name
        );

        continue;
      }

      ////////////////////////////////////////////////////
      // GIVE SOLVER TIME
      ////////////////////////////////////////////////////

      console.log(
        'Waiting for solver...'
      );

      await page.waitForTimeout(10000);

      ////////////////////////////////////////////////////
      // VERIFY
      ////////////////////////////////////////////////////

      const afterText =
        await page.textContent('body');

      const solvedNow =
        afterText?.includes('See puzzle') ||
        afterText?.includes('See results');

      if (solvedNow) {

        console.log(
          'Solved:',
          game.name
        );

      } else {

        console.log(
          'No solved state detected:',
          game.name
        );
      }

    } catch (err) {

      console.log(
        'FAILED:',
        game.name
      );

      console.log(
        err.message
      );

      continue;
    }
  }

  //////////////////////////////////////////////////////
  // DONE
  //////////////////////////////////////////////////////

  console.log('\n==============================');
  console.log('All games processed');
  console.log('Closing browser');

  await browser.close();

})();
