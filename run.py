import os
import time
from linkedin_games_scraper import GameSolver

EMAIL = os.getenv("LINKEDIN_EMAIL")
PASSWORD = os.getenv("LINKEDIN_PASSWORD")

if not EMAIL or not PASSWORD:
    raise Exception("Missing LINKEDIN_EMAIL or LINKEDIN_PASSWORD GitHub secrets")

for attempt in range(3):
    try:
        solver = GameSolver(
            email=EMAIL,
            password=PASSWORD,
            headless=True
        )

        results = solver.solve_all_games()

        print(results)
        print("Finished solving LinkedIn games")
        break

    except Exception as e:
        print(f"Attempt {attempt + 1} failed:", e)

        if attempt < 2:
            time.sleep(30)
        else:
            raise
