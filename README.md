# LinkedIn Daily Games — GitHub Actions runner

This is a GitHub-Actions wrapper around [nqrwhal/linkedin-puzzles](https://github.com/nqrwhal/linkedin-puzzles).

The upstream project already contains a headless Playwright/Docker service that runs all eight supported LinkedIn games sequentially. This wrapper adds the missing **scheduled GitHub Actions layer** and persists the signed-in Chromium profile between runs.

## What it does

Every day the workflow:

1. Starts an Ubuntu GitHub-hosted runner.
2. Downloads the latest successful run's private Chromium profile artifact.
3. Clones the upstream LinkedIn puzzle solver.
4. Builds its headless Playwright/Docker image.
5. Runs `./service/puzzles run`, which attempts all eight games and independently verifies completion.
6. Uploads the updated Chromium profile for the next run.
7. Uploads the run report for debugging.
8. The runner disappears after the job finishes — no VPS/server stays online.

The default schedule is **05:00 India Standard Time (IST)** (`23:30 UTC`).

## Important: one-time login bootstrap

A GitHub-hosted runner cannot show you an interactive LinkedIn login window. You therefore need to seed the persistent browser profile once.

The helper starts the upstream project's temporary noVNC login container and lets you sign into LinkedIn once:

```bash
./scripts/bootstrap-profile.sh
```

This creates:

```text
linkedin-profile-bootstrap.tar.gz
```

That archive contains signed-in Chromium profile data. **Treat it like a password/session credential. Do not commit it.**

### Put the seed in a private GitHub Release

From a machine with the GitHub CLI authenticated to your private repository:

```bash
gh release create profile-seed \
  --repo YOUR_GITHUB_USER/YOUR_REPOSITORY \
  --title "Private LinkedIn profile seed" \
  --notes "Private bootstrap asset; contains signed-in browser session data." \
  linkedin-profile-bootstrap.tar.gz
```

The workflow will use that release asset only when there is no previous successful `linkedin-profile` artifact. After the first successful daily run, the updated profile is stored as the `linkedin-profile` Actions artifact and the release seed is no longer used.

Keep the repository private and do not share the `profile-seed` release asset.

## Workflow schedule

Edit `.github/workflows/daily.yml`:

```yaml
schedule:
  - cron: '30 23 * * *'
```

GitHub cron is UTC. `23:30 UTC` is `05:00 IST` on the following day.

You can also start it manually from the Actions tab with **Run workflow**.

## Upstream solver

The wrapper intentionally does not copy/fork the upstream solver implementation into this repository. It clones the upstream project at runtime so solver fixes can be picked up without duplicating a large codebase.

For reproducibility, set `UPSTREAM_REF` to a specific upstream commit SHA instead of `main` once you have a version you trust.

## Reliability notes

GitHub-hosted runners are ephemeral and can come from different IP addresses. LinkedIn may expire or challenge a session because of account-security checks. There is no supported way for this workflow to solve a CAPTCHA or interactively complete an unexpected identity challenge.

The profile artifact is persisted for 30 days. If GitHub artifact retention or a failed run removes the last usable profile, the account will need to be bootstrapped again.

For maximum reliability, a persistent self-hosted runner/server with the upstream profile stored on disk is still better than GitHub-hosted runners. This repository is specifically for the **no-always-on-server / scheduled GitHub Actions** approach.

## Privacy

The `linkedin-profile` artifact contains signed-in browser session data. Keep this repository private and limit access. Never publish the artifact, workflow logs containing secrets, or the bootstrap archive.
