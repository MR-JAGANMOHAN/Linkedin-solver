import traceback
import time

from linkedin_games_scraper import GameSolver

MAX_RETRIES = 2


def safe_run(name, func):
    try:
        print(f"\n===== SOLVING {name} =====\n")

        result = func()

        print(f"\n{name} SUCCESS")
        print(result)

    except Exception as e:
        print(f"\n{name} FAILED")
        print(str(e))
        traceback.print_exc()


for attempt in range(1, MAX_RETRIES + 1):
    print(f"\n========== ATTEMPT {attempt} ==========\n")

    try:
        solver = GameSolver(headless=True)

        safe_run("Pinpoint", solver.solve_pinpoint)

        time.sleep(5)

        safe_run("CrossClimb", solver.solve_crossclimb)

        time.sleep(5)

        safe_run("Queens", solver.solve_queens)

        time.sleep(5)

        safe_run("Zip", solver.solve_zip)

        time.sleep(5)

        safe_run("Tango", solver.solve_tango)

        time.sleep(5)

        safe_run("Mini Sudoku", solver.solve_mini_sudoku)

        print("\n===== FINISHED ALL GAMES =====\n")

        break

    except Exception as e:
        print("\nGLOBAL FAILURE")
        print(str(e))
        traceback.print_exc()

        time.sleep(20)
