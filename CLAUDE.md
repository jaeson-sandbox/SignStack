@AGENTS.md

# Story Development Workflow

Claude Code manages the full Git and GitHub workflow for each implementation story. Follow this exactly.

## Before Starting Any Story

1. Check status — stop if dirty:
   ```
   git status
   ```
   If anything is uncommitted, stop and explain what is uncommitted before proceeding.

2. Sync main:
   ```
   git checkout main
   git pull
   ```

3. Create a story branch:
   ```
   git checkout -b story/descriptive-story-name
   ```

## Implementation

- Implement **only** the current story. Do not add features, refactor unrelated code, or address future stories.

## Checks (run after implementation)

```
npm run lint
npm run build
npm test          # only when tests exist
```

If any check fails, fix the issue before proceeding. Do not create a PR with failing checks unless the failure is pre-existing and clearly documented.

## Commit

Make small, focused commits as work progresses. Final commit message format:

```
git add <specific files>
git commit -m "feat: concise story description"
```

Do not use `git add .` blindly — stage only relevant files.

## Push

```
git push -u origin story/descriptive-story-name
```

## Create Pull Request

```
gh pr create --title "feat: concise story description" --body "..."
```

**PR body must include:**
- **Summary** — what this PR does and why
- **Story implemented** — story ID and title
- **Acceptance criteria completed** — bullet list of completed ACs
- **Manual test steps** — step-by-step instructions to verify the feature
- **Checks run** — lint / build / test results
- **Screenshots or GIFs** — if any UI changed
- **Risks or follow-ups** — anything deferred, any known edge cases

## Hard Rules

- **Never push directly to main** for implementation stories.
- **Never merge a PR** unless the user explicitly says to merge.
- **Never use `--no-verify`** or skip hooks.
- **If `gh` is not authenticated or unavailable**, stop immediately and tell the user exactly what needs to be fixed.
- **If git status is dirty before starting a story**, stop and explain before doing anything else.
