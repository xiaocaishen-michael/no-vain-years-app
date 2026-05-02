// Prepend `// @ts-nocheck` to every .ts file under src/generated/.
//
// Why: openapi-generator's typescript-fetch template emits code that fails
// our monorepo's strict tsconfig (e.g. `Error.cause` without explicit
// `override` modifier). The generated code is correct, just not aligned with
// our strictness. We exclude it from typecheck rather than relax repo-wide
// rules. Hand-written code in src/ stays under full strict mode.

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GENERATED_DIR = path.resolve(__dirname, '..', 'src', 'generated');
const SENTINEL = '// @ts-nocheck';

async function* walkTsFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkTsFiles(full);
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      yield full;
    }
  }
}

let touched = 0;
for await (const file of walkTsFiles(GENERATED_DIR)) {
  const original = await fs.readFile(file, 'utf8');
  if (original.startsWith(SENTINEL)) continue;
  await fs.writeFile(file, `${SENTINEL}\n${original}`, 'utf8');
  touched += 1;
}
console.log(`inject-ts-nocheck: prepended sentinel to ${touched} file(s)`);
