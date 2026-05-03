#!/usr/bin/env node
// Runtime debug — open localhost:8081 in headless Chromium, capture console
// messages / page errors / failed network requests, dump structured JSON.
//
// Usage:
//   node tools/runtime-debug.mjs                     # default url + 5s wait
//   node tools/runtime-debug.mjs http://localhost:8081/(auth)/login 8000
//   node tools/runtime-debug.mjs --raw               # pretty-print all console (including info/log)
//   node tools/runtime-debug.mjs --shot /tmp/x.png   # capture full-page screenshot
//
// Exit code: 0 if no errors captured, 1 if pageerror / console.error / network fail seen.

import { chromium } from 'playwright';

const args = process.argv.slice(2);
const raw = args.includes('--raw');
const shotIdx = args.indexOf('--shot');
const shotPath = shotIdx >= 0 ? args[shotIdx + 1] : null;
const positional = args.filter(
  (a, i) => !a.startsWith('--') && args[i - 1] !== '--shot',
);
const url = positional[0] ?? 'http://localhost:8081';
const waitMs = Number.parseInt(positional[1] ?? '5000', 10);

const errors = [];
const consoleMsgs = [];
const networkFails = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (msg) => {
  consoleMsgs.push({
    type: msg.type(),
    text: msg.text(),
    location: msg.location(),
  });
});

page.on('pageerror', (err) => {
  errors.push({
    name: err.name,
    message: err.message,
    stack: err.stack?.split('\n').slice(0, 8).join('\n') ?? null,
  });
});

page.on('requestfailed', (req) => {
  networkFails.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  });
});

try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(waitMs);
} catch (e) {
  errors.push({ name: 'navigation', message: String(e), stack: null });
}

const finalUrl = page.url();

if (shotPath) {
  await page.screenshot({ path: shotPath, fullPage: true });
}

await browser.close();

const errorConsoleMsgs = consoleMsgs.filter((m) => m.type === 'error' || m.type === 'warning');
const otherConsoleMsgs = consoleMsgs.filter((m) => m.type !== 'error' && m.type !== 'warning');

const result = {
  target: url,
  finalUrl,
  screenshot: shotPath ?? null,
  pageErrors: errors,
  consoleErrors: errorConsoleMsgs,
  networkFails,
  consoleOther: raw ? otherConsoleMsgs : `${otherConsoleMsgs.length} suppressed (use --raw)`,
};

console.log(JSON.stringify(result, null, 2));

const hadError =
  errors.length > 0 ||
  errorConsoleMsgs.some((m) => m.type === 'error') ||
  networkFails.length > 0;
process.exit(hadError ? 1 : 0);
