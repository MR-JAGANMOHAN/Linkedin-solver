# LinkedIn Daily Games — GitHub Actions

This private repository runs the upstream `nqrwhal/linkedin-puzzles` Chrome extension inside a real Chromium browser on GitHub Actions.

## What happens

Every day at **05:00 IST (23:30 UTC)**:

1. GitHub starts an Ubuntu runner.
2. The upstream repository is cloned, including its Manifest V3 extension.
3. A previously persisted Chromium profile is restored when available.
4. On the first run, the profile is seeded from the `LINKEDIN_STORAGE_STATE_B64` GitHub Secret.
5. Chromium starts normally under Xvfb with the upstream extension loaded.
6. The workflow visits all eight LinkedIn game pages one by one.
7. On each game page it clicks the extension's **Solve by request** button.
8. The workflow waits for LinkedIn's results/completion state and records the verification result.
9. The updated browser profile is saved as a private Actions artifact for the next run.

There is **no Docker solver path** in the daily workflow.

## Supported games

Queens, Tango, Zip, Mini Sudoku, Patches, Pinpoint, Crossclimb, and Wend.

The upstream extension itself injects the Solve button into LinkedIn game pages and handles the puzzle-specific save logic locally in the browser. Its extension manifest targets LinkedIn game pages and includes the debugger/scripting permissions needed by its browser implementation. 

## One-time authentication setup

The repository does **not** contain LinkedIn cookies, passwords, or a browser profile.

Create a Playwright `storageState.json` on your own machine after signing into LinkedIn, then base64-encode that file and add the result as this repository secret:

`LINKEDIN_STORAGE_STATE_B64`

For example, on Git Bash:

```bash
base64 -w 0 storageState.json > storageState.b64
```

On PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('.\storageState.json')) | Set-Content -NoNewline storageState.b64
```

Copy the contents of `storageState.b64` into:

**GitHub → Settings → Secrets and variables → Actions → New repository secret**

Name:

```text
LINKEDIN_STORAGE_STATE_B64
```

Treat the storage-state file and secret like a password. Do not put either in the repository, an issue, a workflow log, or a public release.

## Run it

After adding the secret, open:

**Actions → LinkedIn Daily Games → Run workflow**

The first successful run creates the `linkedin-profile` artifact. Later runs restore that profile automatically.

The workflow also uploads a `linkedin-browser-run-*` artifact containing `report.json` and screenshots for failed games.

The scheduled run is:

```yaml
schedule:
  - cron: '30 23 * * *'
```

## Important limitation

GitHub-hosted runners are ephemeral and can use different network addresses. LinkedIn can expire a session or request an additional security check. This workflow cannot solve a CAPTCHA or an unexpected interactive identity challenge. If the saved session stops working, create a fresh storage state locally and replace `LINKEDIN_STORAGE_STATE_B64`.

## Upstream solver

The extension and browser-side solving implementation are intentionally obtained from the upstream repository at runtime rather than copied here. The workflow accepts an optional branch/tag/commit ref when manually started.
