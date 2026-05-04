#!/usr/bin/env node
// Runtime debug — open localhost:8081 in headless Chromium, capture console
// messages / page errors / failed network requests, optionally drive an
// ordered list of interactions (click / fill / shot / wait / press), dump
// structured JSON.
//
// Usage:
//   node tools/runtime-debug.mjs <url> [actions...]
//
// Actions (process IN ORDER, repeatable):
//   --initial-wait <ms>       wait after page load before running actions
//                              (default 3000; RN-Web needs ~2s to mount)
//   --shot <path>             full-page screenshot to <path>
//   --click <selector>        click element matching selector
//   --fill <selector> <text>  fill input with text
//   --wait <ms>               sleep
//   --press <key>             keyboard press (e.g. Enter / Tab)
//
// Global flags:
//   --raw                     include info/log/debug console msgs in output
//
// Selectors use Playwright syntax — `text=登录` / `[aria-label="手机号"]`
// (RN-Web's accessibilityLabel renders as aria-label).
//
// Examples:
//   # Single screenshot, no interaction
//   node tools/runtime-debug.mjs http://localhost:8081 --shot /tmp/x.png
//
//   # Tab switch then screenshot
//   node tools/runtime-debug.mjs http://localhost:8081 \
//     --shot /tmp/01.png \
//     --click 'text=短信登录' \
//     --wait 300 \
//     --shot /tmp/02.png
//
// Exit code: 0 if no errors captured, 1 if pageerror / console.error /
// network fail / action failure occurred.

import { chromium } from 'playwright';

// ────────────────────────────────────────────────────────────────────────
// Argv parsing — first positional = url; rest is ordered action list.
// ────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const raw = argv.includes('--raw');

const urlIdx = argv.findIndex((a) => !a.startsWith('--'));
const url = urlIdx >= 0 ? argv[urlIdx] : 'http://localhost:8081';

let initialWait = 3000;
const actions = [];

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (i === urlIdx || a === '--raw') continue;
  switch (a) {
    case '--initial-wait':
      initialWait = Number.parseInt(argv[++i], 10);
      break;
    case '--shot':
      actions.push({ type: 'shot', path: argv[++i] });
      break;
    case '--click':
      actions.push({ type: 'click', selector: argv[++i] });
      break;
    case '--fill':
      actions.push({ type: 'fill', selector: argv[++i], value: argv[++i] });
      break;
    case '--wait':
      actions.push({ type: 'wait', ms: Number.parseInt(argv[++i], 10) });
      break;
    case '--press':
      actions.push({ type: 'press', key: argv[++i] });
      break;
    default:
      if (a.startsWith('--')) {
        console.error(`unknown flag: ${a}`);
        process.exit(2);
      }
  }
}

// ────────────────────────────────────────────────────────────────────────
// Browser harness
// ────────────────────────────────────────────────────────────────────────
const errors = [];
const consoleMsgs = [];
const networkFails = [];
const actionLog = [];
let actionFailure = null;

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
  await page.waitForTimeout(initialWait);
} catch (e) {
  errors.push({ name: 'navigation', message: String(e), stack: null });
}

// Run actions sequentially
for (const action of actions) {
  try {
    switch (action.type) {
      case 'shot':
        await page.screenshot({ path: action.path, fullPage: true });
        actionLog.push({ ok: true, ...action });
        break;
      case 'click':
        await page.locator(action.selector).first().click({ timeout: 5_000 });
        actionLog.push({ ok: true, ...action });
        break;
      case 'fill':
        await page.locator(action.selector).first().fill(action.value, { timeout: 5_000 });
        actionLog.push({ ok: true, ...action });
        break;
      case 'wait':
        await page.waitForTimeout(action.ms);
        actionLog.push({ ok: true, ...action });
        break;
      case 'press':
        await page.keyboard.press(action.key);
        actionLog.push({ ok: true, ...action });
        break;
      default:
        actionLog.push({ ok: false, ...action, error: 'unknown action type' });
    }
  } catch (e) {
    actionFailure = { ...action, error: String(e) };
    actionLog.push({ ok: false, ...action, error: String(e) });
    // Capture failure-state screenshot (sibling to last requested or /tmp/failure.png)
    const failPath = '/tmp/runtime-debug-failure.png';
    try {
      await page.screenshot({ path: failPath, fullPage: true });
      actionFailure.screenshotOnFailure = failPath;
    } catch {
      /* ignore */
    }
    break;
  }
}

const finalUrl = page.url();
await browser.close();

// ────────────────────────────────────────────────────────────────────────
// Output
// ────────────────────────────────────────────────────────────────────────
const errorConsoleMsgs = consoleMsgs.filter(
  (m) => m.type === 'error' || m.type === 'warning',
);
const otherConsoleMsgs = consoleMsgs.filter(
  (m) => m.type !== 'error' && m.type !== 'warning',
);

const result = {
  target: url,
  finalUrl,
  initialWait,
  actionLog,
  actionFailure,
  pageErrors: errors,
  consoleErrors: errorConsoleMsgs,
  networkFails,
  consoleOther: raw
    ? otherConsoleMsgs
    : `${otherConsoleMsgs.length} suppressed (use --raw)`,
};

console.log(JSON.stringify(result, null, 2));

const hadError =
  errors.length > 0 ||
  errorConsoleMsgs.some((m) => m.type === 'error') ||
  networkFails.length > 0 ||
  actionFailure !== null;
process.exit(hadError ? 1 : 0);
