# One-time profile seed

1. Run `./scripts/bootstrap-profile.sh` locally and sign into LinkedIn in the temporary noVNC browser.
2. This creates `linkedin-profile-bootstrap.tar.gz`.
3. In your **private** GitHub repository, create a private release tag named `profile-seed` and attach that archive. The easiest command is:

```bash
gh release create profile-seed \
  --repo YOUR_GITHUB_USER/YOUR_REPOSITORY \
  --title "Private LinkedIn profile seed" \
  --notes "Contains signed-in browser session data." \
  linkedin-profile-bootstrap.tar.gz
```

4. Run the **LinkedIn Daily Games** workflow manually once. It will download the seed, run all games, and upload the resulting browser profile as the `linkedin-profile` artifact.
5. Delete the local archive. Keep the private repository/release protected.

The seed release is only for bootstrapping. Subsequent daily runs restore the latest successful run's profile artifact.
