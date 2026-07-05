Stage all changes and commit them with an appropriate Conventional Commit message based on what was done this session.

Steps:
0. Run `pnpm check:lint` if there's any lint errors, if so run `pnpm check:format` to fix them.
1. Run `git branch --show-current`. If it's `main`, warn the user and ask whether to create a new branch before committing (never commit straight to `main`).
2. Run `git status` and `git diff HEAD` (plus `git diff --staged`) to see exactly what changed — both staged and unstaged.
3. Run `git log --oneline -5` to match the repo's existing commit-message style.
4. Decide the commit type from the changes (use the repo's convention):
   - `feat:` — new feature or endpoint/page/capability
   - `fix:` — bug fix
   - `refactor:` — restructure without behavior change
   - `chore:` — tooling, deps, config, formatting, non-code housekeeping
   - `ci:` — CI/CD workflow changes
   - `docs:` — documentation only (incl. `.claude/` context/commands)
   - If changes span multiple types, pick the dominant one; if they're truly unrelated, tell the user and suggest splitting into separate commits.
5. Stage everything: `git add -A`
6. Write a concise message: `<type>: <imperative summary under 70 chars>`. Add a short body only if the change needs context (what + why, not how).
7. Commit. Use a HEREDOC for the message so multi-line bodies format correctly:
   ```
   git commit -m "$(cat <<'EOF'
   <type>: <summary>

   <optional body>
   EOF
   )"
   ```
8. Run `git status` to confirm a clean tree, and print the new commit (`git log --oneline -1`).

Notes:
- Do NOT push — this command only commits locally. Use `/create-pr` to push and open a PR.
- Match the existing repo commit style (lowercase type, no trailing period in the summary).
- If there are no changes to commit, say so and stop.
