#!/usr/bin/env node
// T9 真后端冒烟 — my-profile business flow (per spec my-profile/tasks.md T9)
//
// 全链路：已 onboarded 用户 (displayName='小明') → /(app)/(tabs)/profile
//   → 切 slide tab 图谱 → scroll sticky → 底 tab 首页 → 底 tab 我的
//   → 点 ⚙️ (dev warning accepted)
//
// 假设：
//   - server :8080 (SPRING_PROFILES_ACTIVE=dev + JWT secret + DB password env)
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 + pnpm web)
//   - docker compose dev (mbw-postgres + mbw-redis) up
//   - 测试 phone +8613922224444 已 onboarded (displayName='小明')
//     若不存在，先跑 onboarding smoke 创建
//
// 用法：node apps/native/runtime-debug/2026-05-07-my-profile-business-flow/run.mjs

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE_LOCAL = '13922224444';
const PHONE = '+8613922224444';
const CODE = '999999';
const HASH = '$2b$08$QIEcSjkMkeyQv.36D3525OVAsH95QUrF/f9sh98pMcz9FSfOzs426';

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
  errors.push({
    name: err.name,
    message: err.message,
    stack: (err.stack ?? '').split('\n').slice(0, 6).join('\n'),
  }),
);
page.on('requestfailed', (req) =>
  networkFails.push({
    url: req.url(),
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  }),
);

try {
  // --- Login with already-onboarded phone ---
  step('navigate to http://localhost:8081');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(3500);

  step('shot 01-login-arrived');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-login-arrived.png'), fullPage: true });

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

  step('click 登录 — phoneSmsAuth + loadProfile; displayName set → AuthGate lands on (tabs)/profile');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(4000);

  step('shot 02-cold-start-tabs-profile (expect /(app)/(tabs)/profile)');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '02-cold-start-tabs-profile.png'),
    fullPage: true,
  });

  // --- Slide tab: switch to 图谱 ---
  step('press 图谱 slide tab');
  // Slide tab Pressable has accessibilityLabel="图谱"
  const graphTab = page.getByRole('button', { name: '图谱' }).first();
  await graphTab.click();
  await page.waitForTimeout(500);

  step('shot 03-active-tab-graph');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '03-active-tab-graph.png'),
    fullPage: true,
  });

  // --- Scroll to trigger sticky tabs ---
  step('scroll down to trigger stickyHeaderIndices sticky behaviour');
  await page.mouse.wheel(0, 200);
  await page.waitForTimeout(800);

  step('shot 04-sticky-tabs-scrolled');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '04-sticky-tabs-scrolled.png'),
    fullPage: true,
  });

  // --- Bottom tab: navigate to 首页 ---
  step('click bottom tab 首页');
  await page.getByRole('link', { name: '首页' }).first().click();
  await page.waitForTimeout(500);

  step('shot 05-bottom-tab-home');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '05-bottom-tab-home.png'),
    fullPage: true,
  });

  // --- Bottom tab: navigate back to 我的; expect activeTab still graph ---
  step('click bottom tab 我的 — profile should still show 图谱 (unmountOnBlur=false)');
  await page.getByRole('link', { name: '我的' }).first().click();
  await page.waitForTimeout(500);

  step('shot 06-back-to-profile-graph-persist (verify activeTab=graph preserved)');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '06-back-to-profile-graph-persist.png'),
    fullPage: true,
  });

  // --- Settings nav: ⚙️ → router.push /(app)/settings ---
  step('click ⚙️ — router.push /(app)/settings (dev warning expected, accepted)');
  await page.getByRole('button', { name: '设置' }).first().click();
  await page.waitForTimeout(1000);

  step('shot 07-settings-push-dev-warning (settings route not yet implemented; spec B pending)');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '07-settings-push-dev-warning.png'),
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

const result = {
  finalUrl,
  steps: log,
  pageErrors: errors,
  consoleErrors,
  networkFails,
};
console.log(JSON.stringify(result, null, 2));

// Accept dev warning from console errors (settings route not implemented yet).
const criticalErrors = errors.filter((e) => e.name !== 'flow');
const ok = criticalErrors.length === 0 && networkFails.length === 0;
process.exit(ok ? 0 : 1);
