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
    // commitlint). Footer remains disabled — Dependabot generates auto-footers
    // with long release-note URLs / dep tables that we cannot reflow; bot's
    // commit-message format can't be reconfigured. Body 150 may still trip
    // Dependabot bot commits — TODO follow-up: add `ignores` filter mirror
    // server commitlint.config.mjs line 19 if dependabot PR commitlint fail.
    'body-max-line-length': [2, 'always', 150],
    'footer-max-line-length': [0],
  },
};
