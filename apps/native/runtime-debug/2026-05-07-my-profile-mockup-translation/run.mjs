#!/usr/bin/env node
// T13 visual smoke — my-profile 4 状态截图（per spec my-profile/tasks.md T13）
//
// 目的：验证 mockup translation（PR #70）落地后 my-profile 页 4 个 mockup state
// 视觉形态——default-notes / sticky-scrolled / graph-tab / kb-tab——皆稳定可读。
// AuthGate + 真后端业务流闭环已由 T9（2026-05-07-my-profile-business-flow/）冒烟
// 覆盖；本脚本聚焦视觉态。
//
// 与 onboarding T_smoke 的关键不同：
//   - profile 无 mutation（纯 GET /me）→ 无需 page.route 拦截 / hold+abort 策略
//   - 状态由 scrollY + activeTab useState 驱动，真后端覆盖无 mock
//   - DB 副作用：onboard 写入 displayName='小明' → 用后 cleanup
//
// 流程：
//   0. DB cleanup（fresh phone，防 stale displayName 跳过 onboarding）
//   1. phone-sms-auth 登录 → displayName=null → AuthGate 跳 /(app)/onboarding
//   2. 真实 PATCH /me displayName='小明' → AuthGate 跳 /(app)/(tabs)/profile
//   3. scenario 01-default-notes: scrollY=0, activeTab=notes, TopNav 透明白图标
//   4. scenario 02-sticky-scrolled: wheel(0,350) → Hero 滚出，SlideTabs 钉顶，TopNav 白底深图标
//   5. scenario 03-graph-tab: scroll 回顶 + tap '图谱' → underline 中位
//   6. scenario 04-kb-tab: tap '知识库' → underline 末位
//   7. DB cleanup（删 account + refresh_token + credential）
//
// 假设：
//   - server :8080 (SPRING_PROFILES_ACTIVE=dev + .env.local sourced)
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 + pnpm web)
//   - docker compose dev (mbw-postgres + mbw-redis) up
//
// 用法：node apps/native/runtime-debug/2026-05-07-my-profile-mockup-translation/run.mjs

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE = '+8613922226666';
const PHONE_LOCAL = '13922226666';
const CODE = '999999';
// bcrypt('999999', cost=8) — 与 onboarding / T9 同源
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

step(`db cleanup for ${PHONE}（防 stale displayName 让 AuthGate 跳过 onboarding）`);
dbCleanup();

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  // dev warning: /(app)/settings 路由未落地（spec B pending），接受
  if (text.includes('Unmatched Route') || text.includes('/(app)/settings')) return;
  // RN internal deprecation noise — pointerEvents prop → style.pointerEvents migration
  if (text.includes('props.pointerEvents is deprecated')) return;
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
  if (u.includes('/accounts/me') || u.includes('/phone-sms')) {
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
  // === Setup: login + onboard（一次性获取 token + 设 displayName）===
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

  step('click 登录 — phoneSmsAuth + loadProfile → displayName=null → AuthGate lands on /onboarding');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(3500);

  step('onboarding: fill displayName 小明 + submit → PATCH /me → AuthGate lands on (tabs)/profile');
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  // wait for profile page to settle (AuthGate redirect after store.displayName hydrate)
  await page.waitForTimeout(4000);

  // === scenario 01-default-notes ===
  step('scenario 01-default-notes — scrollY=0, activeTab=notes, Hero full, TopNav transparent');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-default-notes.png'), fullPage: true });

  // === scenario 02-sticky-scrolled ===
  step('scenario 02-sticky-scrolled — wheel(0, 350) past STICKY_THRESHOLD(224)');
  await page.mouse.wheel(0, 350);
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '02-sticky-scrolled.png'),
    fullPage: true,
  });

  // === scenario 03-graph-tab ===
  step('scenario 03-graph-tab — scroll back to top + tap 图谱');
  // ScrollView scroll back via wheel up
  await page.mouse.wheel(0, -500);
  await page.waitForTimeout(600);
  const graphTabBtn = page.getByRole('tab', { name: '图谱' }).first();
  await graphTabBtn.click();
  await page.waitForTimeout(500); // 240ms easeOutCubic + margin
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-graph-tab.png'), fullPage: true });

  // === scenario 04-kb-tab ===
  step('scenario 04-kb-tab — tap 知识库');
  await page.getByRole('tab', { name: '知识库' }).first().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-kb-tab.png'), fullPage: true });
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

step('db cleanup after test（remove onboard side-effect）');
let dbRowAfter = '';
try {
  // Verify first, then cleanup
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
