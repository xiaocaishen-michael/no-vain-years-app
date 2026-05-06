#!/usr/bin/env node
// PHASE 2 visual smoke — onboarding 4 状态截图（per spec onboarding/tasks.md T_smoke）
//
// 目的：验证 mockup translation（PR #66）落地后 onboarding 页 4 个 status
// 视觉形态——idle / submitting / success / error——皆稳定可读。AuthGate
// + 真后端业务流闭环已由 PHASE 1（2026-05-05-onboarding-business-flow/）冒
// 烟覆盖；本脚本聚焦视觉态。
//
// 状态构造：在同一 onboarding 页面上以 page.route 拦 PATCH /api/v1/accounts/me
// 切换响应形态，scenarios 之间用 page.reload 重置 hook 到 idle。
//   1. idle       — 不输入，不提交（裸 form）
//   2. submitting — page.route 拦 PATCH 永不 fulfill；hook 进 submitting
//                    → PrimaryButton loading + label "提交中…"
//   3. success    — page.route mock 200 但 body.displayName=null（hook 进
//                    success 渲染 <SuccessOverlay/>；store.displayName
//                    仍 null，AuthGate 不 redirect → success overlay 视觉稳定）
//   4. error      — page.route mock 400 + body.code='INVALID_DISPLAY_NAME'
//                    → hook 进 error，ErrorRow 显示 toast
//
// 假设：
//   - server :8080 (SPRING_PROFILES_ACTIVE=dev + .env.local sourced)
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 + pnpm web)
//   - docker compose dev (mbw-postgres + mbw-redis + mbw-minio) up
//   - 测试 phone +8613922225555 在 DB 不存在；脚本启动前清理（防 stale displayName）
//
// 用法：node apps/native/runtime-debug/2026-05-06-onboarding-mockup-translation/run.mjs

import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE = '+8613922225555';
const PHONE_LOCAL = '13922225555';
const CODE = '999999';
// bcrypt('999999', cost=8) — 与 PHASE 1 同源
const HASH = '$2b$08$QIEcSjkMkeyQv.36D3525OVAsH95QUrF/f9sh98pMcz9FSfOzs426';
const DISPLAY_NAME = '小明';
const ME_URL = '**/api/v1/accounts/me';

const errors = [];
const consoleErrors = [];
const networkFails = [];
const log = [];

function step(msg) {
  log.push(`[${new Date().toISOString()}] ${msg}`);
  console.error(msg);
}

function dbExec(sql) {
  return execSync(`docker exec mbw-postgres psql -U mbw -d mbw -tAc "${sql}"`, { encoding: 'utf-8' }).trim();
}

step(`db cleanup for ${PHONE}（防 stale displayName 让 AuthGate 直跳 home）`);
dbExec(
  `DELETE FROM account.refresh_token WHERE account_id IN (SELECT id FROM account.account WHERE phone = '${PHONE}'); ` +
    `DELETE FROM account.credential WHERE account_id IN (SELECT id FROM account.account WHERE phone = '${PHONE}'); ` +
    `DELETE FROM account.account WHERE phone = '${PHONE}';`,
);
execSync(
  `docker exec mbw-redis redis-cli DEL 'sms_code:${PHONE}' 'sms-60s:${PHONE}'`,
  { stdio: 'pipe' },
);

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  // 预期噪音：scenario 04 mock 400 INVALID_DISPLAY_NAME 必触发浏览器层 "Failed to load resource: 400"
  if (text.includes('Failed to load resource') && text.includes('400')) return;
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
  // 拦截后被 abort / unroute 的请求会作为 requestfailed 出现，与真实网络故障无别。
  // 用 url 过滤掉 me-mock 引发的 abort，只记真故障。
  const u = req.url();
  if (u.includes('/api/v1/accounts/me')) return;
  networkFails.push({ url: u, method: req.method(), failure: req.failure()?.errorText ?? 'unknown' });
});

async function unrouteAll() {
  await page.unroute(ME_URL).catch(() => {});
}

async function resetToIdle() {
  await unrouteAll();
  await page.reload({ waitUntil: 'domcontentloaded' });
  // RN-Web 重新挂载 + AuthGate hydrate（store 已含 token，跳 /(app)/onboarding）
  await page.waitForTimeout(2500);
}

try {
  step('navigate http://localhost:8081 — login flow（一次性获取 token）');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(3500);

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

  step(`fill code ${CODE}`);
  await page.getByLabel('验证码').first().fill(CODE);
  await page.waitForTimeout(200);

  step('click 登录 — phoneSmsAuth + loadProfile + AuthGate redirect /(app)/onboarding');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(3500);

  // ========== Scenario 1: idle ==========
  step('scenario 01-idle — fresh form，无输入无提交');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-idle.png'), fullPage: true });

  // ========== Scenario 2: submitting ==========
  // hang 策略：handler 内 await 一个外部 release 信号，截图后 release → route.abort
  // 显式终止请求，确保 server 永远收不到 PATCH（DB 不会被污染）。
  // 之前用 `return new Promise(() => {})` 撞过 Playwright 自动 fallback 到 continue
  // 的边角行为 —— DB 实际被写入 "小明"。
  // hold + abort 模式：handler 内 await holdPromise，截图后 release → route.abort
  // 必须先 await abortDone 再 unroute —— Playwright unroute 时若 handler 仍在执
  // 行中（未 fulfill/abort/continue），会 fall-through 到 continue() 把请求送到
  // 真后端。前一轮撞过这个：DB 真被写入 displayName='小明'。
  step(`scenario 02-submitting — page.route 拦 PATCH ${ME_URL}（hold + abort + waitDone）`);
  let releaseHold;
  let signalAbortDone;
  const holdPromise = new Promise((resolve) => {
    releaseHold = resolve;
  });
  const abortDonePromise = new Promise((resolve) => {
    signalAbortDone = resolve;
  });
  let interceptedPatch = false;
  await page.route(ME_URL, async (route) => {
    if (route.request().method() === 'PATCH') {
      interceptedPatch = true;
      step('  ↳ PATCH /me intercepted — holding until screenshot');
      await holdPromise;
      step('  ↳ PATCH /me released — abort');
      try {
        await route.abort('aborted');
      } catch {
        // 极端 race：page 在此期间被 reload，route 已 cancel — 仍算"未到 server"
      } finally {
        signalAbortDone();
      }
      return;
    }
    return route.continue();
  });
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  // hook setStatus('submitting') → PrimaryButton 切到 loading + label "提交中…"
  await page.getByRole('button', { name: '提交中…', exact: true }).first().waitFor({ timeout: 4000 });
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-submitting.png'), fullPage: true });
  if (!interceptedPatch) {
    throw new Error('scenario 02: PATCH /me 未被 page.route 截到 — hang 失效，DB 可能被污染');
  }
  releaseHold();
  await abortDonePromise; // 必等 abort 完成才能 unroute，否则 Playwright fall-through 到真后端

  // ========== Scenario 3: success ==========
  step('scenario 03-success — mock PATCH 200 但 body.displayName=null（AuthGate 不 redirect）');
  await resetToIdle();
  await page.route(ME_URL, async (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 999,
          displayName: null, // 关键：保持 store.displayName=null，AuthGate 不跳走，让 SuccessOverlay 稳定显示
          status: 'ACTIVE',
          createdAt: '2026-05-06T00:00:00Z',
        }),
      });
    }
    return route.continue();
  });
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  await page.getByText('完成！').waitFor({ timeout: 4000 });
  await page.waitForTimeout(300); // SuccessCheck 动画稳定
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-success.png'), fullPage: true });

  // ========== Scenario 4: error ==========
  step('scenario 04-error — mock PATCH 400 + body.code=INVALID_DISPLAY_NAME');
  await resetToIdle();
  await page.route(ME_URL, async (route) => {
    if (route.request().method() === 'PATCH') {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'INVALID_DISPLAY_NAME',
          message: 'displayName 含不可见字符或长度越界',
        }),
      });
    }
    return route.continue();
  });
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  await page.getByText('昵称不合法，请重试').waitFor({ timeout: 4000 });
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-error.png'), fullPage: true });

  await unrouteAll();
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

step('verify DB display_name still null（no real PATCH ever committed）');
let dbRow = '';
try {
  dbRow = dbExec(
    `SELECT id, phone, status, display_name FROM account.account WHERE phone = '${PHONE}';`,
  );
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
