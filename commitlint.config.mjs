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
  },
};
