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

(async () => {

  const browser =
    await chromium.launch({
      headless: true
    });

  const context =
    await browser.newContext({
      storageState: 'cookies.json'
    });

  ////////////////////////////////////////////////////
  // LOAD GAMEHELPER BEFORE PAGE LOAD
  ////////////////////////////////////////////////////

  const helper =
    fs.readFileSync(
      './extension/gameHelper.js',
      'utf8'
    );

  await context.addInitScript({
    content: helper
  });

  const page =
    await context.newPage();

  ////////////////////////////////////////////////////
  // PIPE BROWSER LOGS TO GITHUB LOGS
  ////////////////////////////////////////////////////

  page.on('console', msg => {

    console.log(
      '[BROWSER]',
      msg.text()
    );
  });

  ////////////////////////////////////////////////////
  // PROCESS GAMES
  ////////////////////////////////////////////////////

  for (const game of games) {

    try {

      console.log(
        '\n======================'
      );

      console.log(
        'Opening:',
        game
      );

      await page.goto(
        game,
        {
          waitUntil: 'domcontentloaded',
          timeout: 30000
        }
      );

      console.log(
        'Page loaded'
      );

      await page.waitForTimeout(
        12000
      );

      console.log(
        'Finished:',
        game
      );

    } catch (err) {

      console.log(
        'FAILED:',
        game
      );

      console.log(
        err.message
      );
    }
  }

  await browser.close();

})();
