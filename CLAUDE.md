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
- **Clean code notes** — where the logic lives (functional core vs. imperative shell — see Clean Code and Functional Core Guidelines below), what is pure, and what was tested at the pure level

## Hard Rules

- **Never push directly to main** for implementation stories.
- **Never merge a PR** unless the user explicitly says to merge.
- **Never use `--no-verify`** or skip hooks.
- **If `gh` is not authenticated or unavailable**, stop immediately and tell the user exactly what needs to be fixed.
- **If git status is dirty before starting a story**, stop and explain before doing anything else.

---

# Clean Code and Functional Core Guidelines

Every story must follow these guidelines. **Before coding each story, Claude Code must state in the pre-implementation summary how the design preserves clean-code and functional-core principles.** In the PR body, include a short **Clean code notes** section describing where logic lives and what was tested at the pure level.

## Functional core, imperative shell

Organize code so the parts that are hard to test (browser APIs, DOM, network, third-party SDK side effects) are thin and the parts that contain the actual decisions are pure.

- **Functional core** — pure, deterministic, no I/O. Trivially unit-testable.
  - Reducers (`appReducer.ts` and friends).
  - Validation utilities (`pdfValidator.ts`, future date / overlay validators).
  - Coordinate math (`coordinateMapper.ts` when it lands in Story 4.1, future rotation-aware variants).
  - Overlay calculations (default placement, bounds clamping, hit-testing).
  - Export *planning* (which overlays go on which page, what primitive to call, in what order) — separate from the actual `pdf-lib` mutation.
  - Pure utilities (formatters, parsers, comparators).
- **Imperative shell** — the thin layer that reads/writes the world. No business decisions live here, only orchestration.
  - Browser file input (`<input type="file">` change handlers).
  - DOM events (drag, drop, scroll, keyboard).
  - File download (Blob + anchor click + URL.revokeObjectURL).
  - Canvas operations (signature drawing, typed-signature rendering).
  - `pdf-lib` mutation calls (the actual `drawImage` / `drawText` / `save`).
  - `react-pdf` rendering (`<Document>` / `<Page>`).
  - Hooks that wrap any of the above.

A component that mixes both — e.g., does coordinate math inside a `mousemove` handler — is a refactor target. Pull the math into a pure helper, test it in isolation, have the handler call it.

## Concrete rules

- **Prefer small, focused functions.** A function that needs a section header inside its body is two functions.
- **Keep React components mostly responsible for rendering and user interaction.** Anything else belongs in a hook or a `lib/` utility.
- **Avoid `any`.** Use explicit types. `unknown` with a type guard if the type is genuinely dynamic. The existing `DocumentLoadInfo` structural type in `PDFScrollArea.tsx` is a worked example — it avoids `any` while sidestepping a real cross-package type mismatch.
- **Reducers must stay deterministic and immutable.** No `crypto.randomUUID()` inside the reducer (use a `createOverlay()`-style factory at the dispatch site). No `Date.now()` either. Same input → same output, always.
- **Do not mutate Maps, arrays, or objects in place.** Clone before updating (`new Map(prev).set(k, v)`, `[...arr, x]`, `{ ...obj, k: v }`). The existing `setMapEntry` helper in `appReducer.ts` is the pattern.
- **Avoid hidden side effects in reducers and utility functions.** No `console.log` for app behavior, no DOM reads, no clipboard writes — those go in the imperative shell.
- **Keep effects isolated in hooks/components.** A pure function that conditionally calls `fetch` is no longer pure.
- **Avoid mixing PDF manipulation logic directly into React components.** Wrap `pdf-lib` and `pdfjs-dist` calls in `src/lib/pdf/*` modules and call them from hooks. The PDF surface area is high-risk; isolating it makes upgrades survivable.
- **Avoid large components.** When a component grows multiple responsibilities (state derivation + IntersectionObserver wiring + rendering + dispatch), split it. `PDFScrollArea` is approaching this limit and is on the watch list.
- **Add tests for pure functions and reducer logic.** Components without pure cores are tested manually in the browser — that's fine, but it means the pure core should carry more of the logic so more of the behavior is unit-tested.
- **Prefer dependency injection for hard-to-test browser APIs when practical.** A function that takes a `clipboard: { writeText(s: string): Promise<void> }` parameter is testable against a fake; one that calls `navigator.clipboard.writeText` directly is not.
- **Do not introduce new dependencies without explaining why.** Justify in the PR body: what does it do, what would we write ourselves, what's the bundle / privacy / maintenance cost. The baseline-verification.md doc is the source of truth for what's already approved.
- **Do not over-engineer abstractions before a second use case exists** — *but do design around known roadmap needs* like the overlay-type discriminator (Phase 2). A no-op extension point that costs nothing today and saves a refactor later is fine; a speculative framework that adds complexity today for a feature that may never ship is not.

## In practice

When you write the pre-implementation plan, name the pure pieces and the shell pieces explicitly. When you write the PR body, add a **Clean code notes** section that names:

1. **What's pure** (which file / function, and how it's tested).
2. **What's the shell** (where the side effects live, and why they can't be pulled into the core).
3. **What was unit-tested vs. what relies on the browser smoke test.**

This is short — 3–6 lines, not a treatise. The goal is to make the architectural call visible so it can be reviewed.
