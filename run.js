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

const solverScript =
  fs.readFileSync('./solver.js', 'utf8');

(async () => {

  console.log(
    'Launching Chromium...'
  );

  const browser =
    await chromium.launch({
      headless: true
    });

  const context =
    await browser.newContext({
      storageState: 'cookies.json'
    });

  const page =
    await context.newPage();

  ////////////////////////////////////////////////////////
  // LOOP GAMES
  ////////////////////////////////////////////////////////

  for (const game of games) {

    try {

      console.log(
        '\\n=============================='
      );

      console.log(
        'Opening:',
        game.name
      );

      console.log(
        game.url
      );

      ////////////////////////////////////////////////////
      // OPEN PAGE
      ////////////////////////////////////////////////////

      await page.goto(
        game.url,
        {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        }
      );

      console.log(
        'Page loaded'
      );

      ////////////////////////////////////////////////////
      // WAIT FULL RENDER
      ////////////////////////////////////////////////////

      await page.waitForTimeout(5000);

      ////////////////////////////////////////////////////
      // CHECK SOLVED STATE
      ////////////////////////////////////////////////////

      const bodyText =
        await page.textContent('body');

      const alreadySolved =
        bodyText.includes('See puzzle') ||
        bodyText.includes('See results');

      if (alreadySolved) {

        console.log(
          'Already solved:',
          game.name
        );

        continue;
      }

      ////////////////////////////////////////////////////
      // INJECT SOLVER
      ////////////////////////////////////////////////////

      console.log(
        'Injecting solver...'
      );

      await page.addScriptTag({
        content: solverScript
      });

      ////////////////////////////////////////////////////
      // WAIT SOLVER
      ////////////////////////////////////////////////////

      await page.waitForTimeout(7000);

      ////////////////////////////////////////////////////
      // CHECK RESULT
      ////////////////////////////////////////////////////

      const afterText =
        await page.textContent('body');

      const solvedNow =
        afterText.includes('See puzzle') ||
        afterText.includes('See results');

      if (solvedNow) {

        console.log(
          'Solved successfully:',
          game.name
        );

      } else {

        console.log(
          'Solver ran but solve state not detected:',
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

  ////////////////////////////////////////////////////////
  // FINISH
  ////////////////////////////////////////////////////////

  console.log(
    '\\nAll games processed'
  );

  await browser.close();

})();
