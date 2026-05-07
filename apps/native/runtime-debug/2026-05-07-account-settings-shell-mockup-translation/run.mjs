#!/usr/bin/env node
// T15 visual smoke — account-settings-shell 5 状态截图(per spec account-settings-shell/tasks.md T15)
//
// 目的:验证 mockup translation 落地后 settings shell 5 page 视觉形态稳定 — settings 主页 /
// account-security 子页 / phone mask / 法规 ×2 — 全部对得上 mockup design/source/SettingsShellPreview.tsx。
// AuthGate + 真后端业务流闭环已由 T9 集成测覆盖;本脚本聚焦视觉态。
//
// 流程:
//   0. DB cleanup(fresh phone)
//   1. phone-sms-auth 登录 → displayName=null → AuthGate 跳 /(app)/onboarding
//   2. PATCH /me displayName='小明' → AuthGate 跳 /(app)/(tabs)/profile
//   3. tap ⚙️ → /(app)/settings/index → screenshot 01-settings
//   4. tap "账号与安全" → /(app)/settings/account-security/index → screenshot 02-account-security(phone mask 渲染)
//   5. tap "手机号" → /(app)/settings/account-security/phone → screenshot 03-phone-mask
//   6. 返回 ×2 + tap "《个人信息收集与使用清单》" → screenshot 04-legal-personal-info
//   7. 返回 + tap "《第三方共享清单》" → screenshot 05-legal-third-party
//   8. DB cleanup
//
// 假设:
//   - server :8080 (SPRING_PROFILES_ACTIVE=dev)
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080)
//   - docker compose dev (mbw-postgres + mbw-redis) up
//
// 用法: node apps/native/runtime-debug/2026-05-07-account-settings-shell-mockup-translation/run.mjs

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE = '+8613922228888';
const PHONE_LOCAL = '13922228888';
const CODE = '999999';
// bcrypt('999999', cost=8) — 与 onboarding / my-profile T15 同源
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

function dbExec(sql) {
  return execSync(`docker exec mbw-postgres psql -U mbw -d mbw -tAc "${sql}"`, {
    encoding: 'utf-8',
  }).trim();
}

function dbCleanup() {
  dbExec(
    `DELETE FROM account.refresh_token WHERE account_id IN (SELECT id FROM account.account WHERE phone = '${PHONE}'); ` +
      `DELETE FROM account.credential WHERE account_id IN (SELECT id FROM account.account WHERE phone = '${PHONE}'); ` +
      `DELETE FROM account.account WHERE phone = '${PHONE}';`,
  );
  execSync(`docker exec mbw-redis redis-cli DEL 'sms_code:${PHONE}' 'sms-60s:${PHONE}'`, {
    stdio: 'pipe',
  });
}

step(`db cleanup for ${PHONE}`);
dbCleanup();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  // RN internal deprecation noise
  if (text.includes('props.pointerEvents is deprecated')) return;
  // Expo Router benign warnings during dev
  if (text.includes('Unmatched Route')) return;
  consoleErrors.push({ type: m.type(), text });
});
page.on('pageerror', (err) =>
  errors.push({
    name: err.name,
    message: err.message,
    stack: (err.stack ?? '').split('\n').slice(0, 6).join('\n'),
  }),
);
page.on('request', (req) => {
  const u = req.url();
  if (u.includes('/accounts/me') || u.includes('/phone-sms') || u.includes('/logout')) {
    step(`  [REQ] ${req.method()} ${u}`);
  }
});
page.on('response', (resp) => {
  const u = resp.url();
  if (u.includes('/accounts/me')) {
    step(`  [RESP] ${resp.status()} ${u}`);
  }
});
page.on('requestfailed', (req) => {
  networkFails.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  });
});

try {
  // === Setup: login + onboard ===
  step('navigate http://localhost:8081 — login flow');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(3500);

  step(`fill phone ${PHONE_LOCAL}`);
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(200);

  step('click 获取验证码');
  await page.getByLabel('获取验证码').first().click();
  await page.waitForTimeout(1500);

  step(`seed Redis sms_code:${PHONE}`);
  execSync(
    `docker exec mbw-redis redis-cli HSET 'sms_code:${PHONE}' codeHash '${HASH}' attemptCount 0`,
    { stdio: 'pipe' },
  );
  execSync(`docker exec mbw-redis redis-cli EXPIRE 'sms_code:${PHONE}' 300`, { stdio: 'pipe' });

  step(`fill code ${CODE}`);
  await page.getByLabel('验证码').first().fill(CODE);
  await page.waitForTimeout(200);

  step('click 登录 → AuthGate lands on /(app)/onboarding');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(3500);

  step('onboarding: fill displayName + submit → AuthGate lands on (tabs)/profile');
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  await page.waitForTimeout(4000);

  // === scenario 01-settings ===
  step('scenario 01-settings — tap ⚙️ → push /(app)/settings');
  await page.getByLabel('设置').first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-settings.png'), fullPage: true });

  // === scenario 02-account-security ===
  step('scenario 02-account-security — tap "账号与安全" → push account-security/index');
  await page.getByRole('button', { name: '账号与安全' }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '02-account-security.png'),
    fullPage: true,
  });

  // === scenario 03-phone-mask ===
  step('scenario 03-phone-mask — tap "手机号" → push account-security/phone');
  await page.getByRole('button', { name: '手机号' }).first().click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-phone-mask.png'), fullPage: true });

  // === scenario 04-legal-personal-info ===
  step('scenario 04 — back ×2 + tap "《个人信息收集与使用清单》"');
  await page.goBack();
  await page.waitForTimeout(800);
  await page.goBack();
  await page.waitForTimeout(800);
  await page.getByRole('link', { name: '《个人信息收集与使用清单》' }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '04-legal-personal-info.png'),
    fullPage: true,
  });

  // === scenario 05-legal-third-party ===
  step('scenario 05 — back + tap "《第三方共享清单》"');
  await page.goBack();
  await page.waitForTimeout(800);
  await page.getByRole('link', { name: '《第三方共享清单》' }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '05-legal-third-party.png'),
    fullPage: true,
  });
} catch (e) {
  errors.push({
    name: 'flow',
    message: String(e),
    stack: e?.stack?.split('\n').slice(0, 6).join('\n') ?? null,
  });
  await page
    .screenshot({ path: path.join(SHOTS_DIR, '99-failure.png'), fullPage: true })
    .catch(() => {});
}

const finalUrl = page.url();
await browser.close();

step('db cleanup after test');
let dbRowAfter = '';
try {
  dbRowAfter = dbExec(
    `SELECT id, phone, status, display_name FROM account.account WHERE phone = '${PHONE}';`,
  );
  step(`db row before cleanup: ${dbRowAfter}`);
  dbCleanup();
  const afterCleanup = dbExec(
    `SELECT COUNT(*) FROM account.account WHERE phone = '${PHONE}';`,
  );
  step(`rows after cleanup: ${afterCleanup} (expect 0)`);
} catch (e) {
  errors.push({ name: 'db-cleanup', message: String(e), stack: null });
}

const result = {
  finalUrl,
  dbRowBeforeCleanup: dbRowAfter,
  steps: log,
  pageErrors: errors,
  consoleErrors,
  networkFails,
};
console.log(JSON.stringify(result, null, 2));

const ok = errors.length === 0 && consoleErrors.length === 0 && networkFails.length === 0;
process.exit(ok ? 0 : 1);
