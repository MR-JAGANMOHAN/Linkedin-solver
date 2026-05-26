import sys
import time
import traceback

from selenium import webdriver
from selenium.webdriver.chrome.options import Options

from linkedin_games_scraper import GameSolver

MAX_RETRIES = 3


def create_driver():
    chrome_options = Options()

    chrome_options.add_argument("--headless=new")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--disable-blink-features=AutomationControlled")
    chrome_options.add_argument("--disable-extensions")
    chrome_options.add_argument("--dns-prefetch-disable")

    driver = webdriver.Chrome(options=chrome_options)

    return driver


def solve_games():
    driver = create_driver()

    solver = GameSolver(
        driver=driver,
        headless=True
    )

    results = solver.solve_all_games()

    print("\n===== RESULTS =====")
    print(results)

    driver.quit()

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
