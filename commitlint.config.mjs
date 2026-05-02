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
    // Disable body / footer line length — Dependabot generates auto-bodies
    // with long release-note URLs / dep tables that exceed 100 chars and the
    // bot's commit-message format can't be reconfigured. Header (PR title)
    // length is still enforced; that's the part developers actually write.
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
