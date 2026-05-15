import { lstatSync } from 'node:fs';

// Filter out symbolic links. prettier 不跟随 symlink 会显式报错
// "Explicitly specified pattern is a symbolic link"
// (impl 仓 spec.md / user-journey.md 是 symlink → meta canonical,
// per docs/plans/26-05-14-witty-churning-tome.md § 2.5).
function realFiles(files) {
  return files.filter((f) => !lstatSync(f).isSymbolicLink());
}

function quote(files) {
  return files.map((f) => `"${f}"`).join(' ');
}

export default {
  '*.{ts,tsx}': (files) => {
    const real = realFiles(files);
    return real.length ? [`prettier --write ${quote(real)}`] : [];
  },
  '*.{json,yaml,yml}': (files) => {
    const real = realFiles(files);
    return real.length ? [`prettier --write ${quote(real)}`] : [];
  },
  '*.md': (files) => {
    const real = realFiles(files);
    if (!real.length) return [];
    return [
      `prettier --write ${quote(real)}`,
      `npx -y markdownlint-cli2 ${quote(real)}`,
    ];
  },
};
