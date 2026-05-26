import sys
import time
import traceback
import os

from linkedin_games_scraper import GameSolver

MAX_RETRIES = 3

# Better Chrome stability in GitHub Actions
os.environ["CHROME_EXTRA_ARGS"] = (
    "--headless=new "
    "--no-sandbox "
    "--disable-dev-shm-usage "
    "--disable-gpu "
    "--window-size=1920,1080 "
    "--disable-blink-features=AutomationControlled "
    "--disable-extensions "
    "--dns-prefetch-disable"
)


def solve_games():
    solver = GameSolver(headless=True)

    results = solver.solve_all_games()

    print("\n===== RESULTS =====")
    print(results)

    return results


if __name__ == "__main__":
    success = False

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"\nAttempt {attempt}/{MAX_RETRIES}\n")

            solve_games()

            print("\nAll games solved successfully")
            success = True
            break

        except Exception as e:
            print("\nERROR:")
            print(str(e))
            traceback.print_exc()

            if attempt < MAX_RETRIES:
                print("\nRetrying in 30 seconds...\n")
                time.sleep(30)

    if not success:
        print("\nFAILED AFTER ALL RETRIES")
        sys.exit(1)
