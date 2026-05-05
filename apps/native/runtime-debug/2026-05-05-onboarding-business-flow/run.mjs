#!/usr/bin/env node
// T7 真后端冒烟 — onboarding business flow (per spec onboarding/tasks.md)
//
// 全链路：fresh phone → /(auth)/login → 获取验证码 → seed redis (race
// fix server hash) → submit → AuthGate 跳 /(app)/onboarding → fill 昵称
// → submit → AuthGate 跳 /(app)/
//
// 假设：
//   - server :8080 (SPRING_PROFILES_ACTIVE=dev + JWT secret + DB password env)
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 + pnpm web)
//   - docker compose dev (mbw-postgres + mbw-redis + mbw-minio) up
//   - 测试 phone +8613922224444 在 DB 不存在 (server unified auth 自动创建)
//
// 用法：node apps/native/runtime-debug/2026-05-05-onboarding-business-flow/run.mjs

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

// Server / Redis use E.164 (+86...). UI's PhoneInput shows static +86 prefix
// + accepts 11 digits only — fill with PHONE_LOCAL; useLoginForm.toE164 wraps.
const PHONE = '+8613922224444';
const PHONE_LOCAL = '13922224444';
const CODE = '999999';
// bcrypt('999999', cost=8) — 与既有 phase 4 scenario README 同源
const HASH = '$2b$08$QIEcSjkMkeyQv.36D3525OVAsH95QUrF/f9sh98pMcz9FSfOzs426';
const DISPLAY_NAME = '小明';

const errors = [];
const consoleErrors = [];
const networkFails = [];
const log = [];

function step(msg) {
  log.push(`[${new Date().toISOString()}] ${msg}`);
  console.error(msg);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') {
    consoleErrors.push({ type: m.type(), text: m.text() });
  }
});
page.on('pageerror', (err) =>
  errors.push({ name: err.name, message: err.message, stack: (err.stack ?? '').split('\n').slice(0, 6).join('\n') }),
);
page.on('requestfailed', (req) =>
  networkFails.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  }),
);

try {
  step('navigate to http://localhost:8081');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(3500); // RN-Web mount + AuthGate hydrate + redirect to /(auth)/login

  step('shot 01-login-initial');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-login-initial.png'), fullPage: true });

  step(`fill phone ${PHONE_LOCAL} (UI strips +86 prefix; toE164 wraps before submit)`);
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(200);

  step('click 获取验证码 — server writes Redis hash');
  await page.getByLabel('获取验证码').first().click();
  await page.waitForTimeout(1500);

  step(`seed Redis sms_code:${PHONE} with known bcrypt hash of ${CODE} (race-fix)`);
  execSync(
    `docker exec mbw-redis redis-cli HSET 'sms_code:${PHONE}' codeHash '${HASH}' attemptCount 0`,
    { stdio: 'pipe' },
  );
  execSync(`docker exec mbw-redis redis-cli EXPIRE 'sms_code:${PHONE}' 300`, { stdio: 'pipe' });

  step('shot 02-login-form-ready');
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-login-form-ready.png'), fullPage: true });

  step(`fill code ${CODE}`);
  await page.getByLabel('验证码').first().fill(CODE);
  await page.waitForTimeout(200);

  step('click 登录 — phoneSmsAuth + loadProfile + AuthGate redirect /(app)/onboarding');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(3500);

  step('shot 03-onboarding-arrived (expect /(app)/onboarding)');
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-onboarding-arrived.png'), fullPage: true });

  step(`fill displayName ${DISPLAY_NAME}`);
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);

  step('click 提交 — updateDisplayName + AuthGate redirect /(app)/');
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  await page.waitForTimeout(3500);

  step('shot 04-after-submit-home (expect /(app)/)');
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-after-submit-home.png'), fullPage: true });
} catch (e) {
  errors.push({ name: 'flow', message: String(e), stack: e?.stack?.split('\n').slice(0, 6).join('\n') ?? null });
  await page
    .screenshot({ path: path.join(SHOTS_DIR, '99-failure.png'), fullPage: true })
    .catch(() => {});
}

const finalUrl = page.url();
await browser.close();

step('verify DB display_name written');
let dbRow = '';
try {
  dbRow = execSync(
    `docker exec mbw-postgres psql -U mbw -d mbw -tAc "SELECT id, phone, status, display_name FROM account.account WHERE phone = '${PHONE}';"`,
    { encoding: 'utf-8' },
  ).trim();
} catch (e) {
  errors.push({ name: 'db-query', message: String(e), stack: null });
}

const result = {
  finalUrl,
  dbRow,
  steps: log,
  pageErrors: errors,
  consoleErrors,
  networkFails,
};
console.log(JSON.stringify(result, null, 2));

const ok = errors.length === 0 && consoleErrors.length === 0 && networkFails.length === 0;
process.exit(ok ? 0 : 1);
