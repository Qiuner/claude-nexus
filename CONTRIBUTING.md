# Contributing to claude-nexus

Thank you for your interest in contributing! Please read this guide before submitting a PR.

---

## Development Setup

```bash
# Install dependencies
yarn

# Start development mode
yarn dev:chrome

# Build for production
yarn build:chrome
```

After each build:

1. Go to `chrome://extensions`
2. Find claude-nexus → click refresh
3. Refresh claude.ai

---

## Branch Naming

| Type     | Format                       | Example                |
| -------- | ---------------------------- | ---------------------- |
| Feature  | `feat/short-description`     | `feat/batch-delete`    |
| Bug fix  | `fix/short-description`      | `fix/sidebar-collapse` |
| Refactor | `refactor/short-description` | `refactor/selectors`   |
| Docs     | `docs/short-description`     | `docs/update-readme`   |

**Before submitting a PR, always sync with the latest `main` first:**

```bash
git fetch origin
git rebase origin/main
```

---

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>: <description>
```

| Type       | When to use                              |
| ---------- | ---------------------------------------- |
| `feat`     | New feature                              |
| `fix`      | Bug fix                                  |
| `style`    | Visual/CSS changes only, no logic change |
| `refactor` | Code restructure, no behavior change     |
| `docs`     | Documentation only                       |
| `chore`    | Build, deps, config                      |

**Examples:**

```
feat: add batch delete support
fix: hide folder UI when sidebar is collapsed
refactor: centralize DOM selectors into constants/selectors.ts
style: refine sidebar UI to match Claude native design
```

---

## Code Standards

- **Language**: Comments in English
- **Types**: No `any`; exported functions must have explicit return types; prefer `type` over `interface`
- **Styles**: TailwindCSS only; use `rem`/`vh` for sizing; avoid inline styles (except dynamic values)
- **Selectors**: All DOM selectors must be defined in `src/constants/selectors.ts`, not hardcoded inline
- **i18n**: No hardcoded UI strings; all user-facing text must use `t()` from i18next
- **Comments**: Core logic and non-obvious implementations must include inline comments explaining the "why", not the "what". Hook entry points and public service functions should have a brief JSDoc summary.

## Dependency Direction

```
components → hooks → services → utils
                ↑
          src/types/  (importable by all layers)
```

Do not import in the reverse direction.

---

## Pull Request Requirements

1. **Sync with main** before opening a PR (see branch naming section above)
2. **Fill out the PR template** completely
3. **Run `yarn build:chrome`** and confirm it compiles without errors
4. **Test manually** on claude.ai before submitting
5. One PR per feature or fix — keep changes focused

---

## Project Structure

Key directories:

```
src/
├── constants/selectors.ts   ← All DOM selectors
├── types/                   ← Shared TypeScript types
├── services/                ← Storage, i18n, export formatters
├── utils/                   ← DOM helpers, utilities
└── pages/content/
    ├── components/          ← React components
    └── hooks/               ← Custom hooks
```

For adding a new float ball panel, register it in `components/FloatBall/panelRegistry.ts` — no changes to the float ball core needed.
