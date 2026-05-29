import { chromium } from 'playwright';
import path from 'path';

const games = [
  'https://www.linkedin.com/games/pinpoint/',
  'https://www.linkedin.com/games/crossclimb/',
  'https://www.linkedin.com/games/zip/',
  'https://www.linkedin.com/games/tango/',
  'https://www.linkedin.com/games/queens/',
  'https://www.linkedin.com/games/mini-sudoku/',
  'https://www.linkedin.com/games/patches/'
];

const extensionPath =
  path.join(process.cwd(), 'extension');

(async () => {

  console.log('Launching Chromium');

  const context =
    await chromium.launchPersistentContext(
      './profile',
      {
        headless: false,

        storageState: 'cookies.json',

        args: [
          `--disable-extensions-except=${extensionPath}`,
          `--load-extension=${extensionPath}`
        ]
      }
    );

  const page =
    await context.newPage();

  page.on('console', msg => {
    console.log(
      '[BROWSER]',
      msg.text()
    );
  });

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
          waitUntil:
            'domcontentloaded',
          timeout: 30000
        }
      );

      await page.waitForTimeout(
        8000
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

  await context.close();

})();
