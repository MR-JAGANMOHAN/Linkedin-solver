#!/usr/bin/env bash
set -euo pipefail

# One-time local bootstrap helper.
# It starts the upstream service's login window so you can sign into LinkedIn once,
# then packages service/data/home for upload to a private GitHub repository.
#
# Requirements: Docker Desktop/Engine + Compose, git, and a local browser that can
# access the temporary noVNC page.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
UPSTREAM_DIR="$ROOT_DIR/upstream"

if [[ ! -d "$UPSTREAM_DIR/.git" ]]; then
  git clone https://github.com/nqrwhal/linkedin-puzzles.git "$UPSTREAM_DIR"
fi

mkdir -p "$UPSTREAM_DIR/service/data"
cd "$UPSTREAM_DIR/service"

echo "Building the upstream service image..."
docker compose build solver

echo
echo "Starting the temporary LinkedIn login window."
echo "Run this in another terminal if needed:"
echo "  docker compose ps"
echo
echo "The login service is exposed at: http://127.0.0.1:6080/vnc.html?autoconnect=1&resize=scale"
echo "Sign in to LinkedIn there. After the authenticated game/feed page loads, stop the login service."

docker compose up -d login

trap 'docker compose stop login >/dev/null 2>&1 || true' EXIT

read -r -p "Press Enter after the LinkedIn profile has logged in and the authenticated page is visible... " _
docker compose stop login

profile="$UPSTREAM_DIR/service/data/home"
if [[ ! -d "$profile" ]]; then
  echo "ERROR: $profile was not created. Login did not persist a browser profile." >&2
  exit 1
fi

archive="$ROOT_DIR/linkedin-profile-bootstrap.tar.gz"
tar -C "$profile" -czf "$archive" .
chmod 600 "$archive"

echo
echo "Created: $archive"
echo "Keep this file private: it contains signed-in LinkedIn browser session data."
echo "See README.md for uploading it as the linkedin-profile GitHub Actions artifact."
