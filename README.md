# LinkedIn Games Bot

Automatically solves LinkedIn daily games using GitHub Actions.

## Features

- Solves all supported LinkedIn games
- Runs automatically once daily
- Uses GitHub Actions free tier
- Stops automatically after solving
- Headless Chrome support
- Very low GitHub minutes usage

## Setup

### 1. Create Private GitHub Repository

Upload all files from this ZIP.

### 2. Add LinkedIn Cookies Secret

Open:

Settings → Secrets and variables → Actions

Create new repository secret:

```txt
LINKEDIN_COOKIES
```

Paste your full exported LinkedIn cookies JSON.

### 3. Export Cookies

Recommended extension:

Cookie-Editor

Login to LinkedIn and export ALL cookies as JSON.

### 4. Enable GitHub Actions

Open:

Actions tab → Enable workflows

### 5. Run Manual Test

Actions → Solve LinkedIn Games → Run workflow

## Schedule

Current schedule:

11:00 AM IST daily

Modify inside:

.github/workflows/solve.yml

Cron line:

```yaml
- cron: '30 5 * * *'
```

## Notes

- Keep repository PRIVATE
- Refresh cookies if LinkedIn session expires
- Do NOT run excessively
