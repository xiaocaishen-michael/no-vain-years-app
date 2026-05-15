// Conventional Commits enforcement (no-vain-years-app).
// Mirror of meta + my-beloved-server commitlint.config.mjs to avoid drift.
// Used by CI (wagoid/commitlint-github-action) and PR title check.
// Local fast-path runs as a regex check via lefthook commit-msg hook.
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [0],
    'header-max-length': [2, 'always', 100],
    'subject-case': [0],
    // Body 150 chars (default 100 too tight for Chinese; mirrors meta + server
    // commitlint).
    'body-max-line-length': [2, 'always', 150],
    // Align footer to body limit (150). Default 100 caught body lines when
    // commit contains a trailer (e.g. Co-Authored-By:) — commitlint footer
    // algorithm pulls trailing body content into footer scope. server PR
    // #191 实证 2026-05-15. Dependabot exempt via `ignores` filter below.
    'footer-max-line-length': [2, 'always', 150],
  },
  // Skip body line-length check for dependabot — its auto-generated body
  // includes long URLs from upstream release notes that we cannot reflow.
  ignores: [(message) => /Signed-off-by: dependabot\[bot\]/.test(message)],
};
