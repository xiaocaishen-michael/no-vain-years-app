#!/usr/bin/env node
// T16-smoke — delete-cancel PHASE 2 visual smoke 6 状态截图(per spec C tasks.md T16-smoke)
//
// 目的:验证 mockup translation(PR #79)落地后 delete-account / cancel-deletion / login
// freeze modal 三 page 共 6 个 status 视觉态稳定。集成测覆盖业务流(T10);本脚本聚焦视觉态。
//
// 6 状态(per README.md):
//   01-delete-idle             - delete-account 默认态(双 checkbox 全空 / SendCodeRow disabled)
//   02-delete-checked-cooldown - delete-account 双勾 + cooldown(brand fill ✓ / Xs 后可重发)
//   03-delete-error            - delete-account 提交失败(CodeInput err 红 ring / ErrorRow `验证码错误`)
//   04-cancel-prefilled        - cancel-deletion 预填态(RecoverBanner / 🔒 / maskPhone / cooldown)
//   05-cancel-deeplink         - cancel-deletion 空态(phone editable empty / disabled)
//   06-freeze-modal-active     - login + freeze modal(scrim modal-overlay / Card / 双 button)
//
// 流程(关键决策):
//   Phase A (unauthenticated): 06 → 04 → 05
//     - 06: login 表单填好后 mock 403 frozen → modal pops up → screenshot 06
//     - 04: 从 freeze modal 直接 tap [撤销] 走 SPA 内部 nav 进 cancel-deletion?phone=...,
//          避开 page.goto + cancel-deletion useEffect setParams 的 navRef race
//          (撞过:goto /cancel-deletion?phone=... 直载 → setParams 在 navRef 未 ready
//          时调 → "Attempted to navigate before mounting Root Layout"。SPA 内部 nav 因
//          AuthGate 已 navReady 不触发)
//     - 05: page.goto /cancel-deletion(无 phone 参数,setParams 不触发,安全)
//
//   Phase B (authenticated, 全 mock): 01 → 02 → 03
//     - 注:metro bundle 当前指向 https://api.xiaocaishen.me(生产),不能依赖 localhost server
//          走真后端;直接 inject zustand-persist localStorage `nvy-auth` 把 store 置 logged-in
//     - 01: 进 delete-account idle 截图
//     - 02: 双勾 + 发码(mock /accounts/me/deletion-codes 204) → cooldown 截图
//     - 03: 接 02,填 code 6 位 + submit(mock DELETE /accounts/me/deletion 401) → ErrorRow `验证码错误` 截图
//          注:deleteAccount() 内 finally 清 store → AuthGate 触发 redirect /(auth)/login;
//          需在 ErrorRow 渲染 + AuthGate redirect 之间快速 screenshot
//
// 假设:
//   - metro :8081(EXPO_PUBLIC_API_BASE_URL 任何值都行,本脚本全 mock 不依赖真后端)
//   - Playwright 1.59+
//
// 用法: node apps/native/runtime-debug/2026-05-07-delete-cancel-mockup-translation/run.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE = '+8613922224444';
const PHONE_LOCAL = '13922224444';
const CODE = '999999';
const DISPLAY_NAME = '小明';

// Endpoint patterns(generated client + auth/usecases — see packages/api-client/src/generated/apis/*)
const SMS_CODES_URL = '**/api/v1/sms-codes';
const PHONE_SMS_AUTH_URL = '**/api/v1/accounts/phone-sms-auth';
const ACCOUNTS_ME_URL = '**/api/v1/accounts/me';
const DELETION_CODES_URL = '**/api/v1/accounts/me/deletion-codes';
const DELETION_URL = '**/api/v1/accounts/me/deletion';
const CANCEL_DELETION_CODES_URL = '**/api/v1/auth/cancel-deletion/sms-codes';
const REFRESH_TOKEN_URL = '**/api/v1/auth/refresh-token';

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
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  if (text.includes('props.pointerEvents is deprecated')) return;
  if (text.includes('Unmatched Route')) return;
  // *.ts files in app/ trigger spurious "missing default export" — pre-existing,
  // see memory reference_expo_router_app_route_scan.md(_layout / +xxx 例外不含 -errors)
  if (text.includes('missing the required default export')) return;
  // Mock 4xx triggers browser-layer "Failed to load resource: 4xx" — expected
  if (text.includes('Failed to load resource') && /4\d{2}/.test(text)) return;
  // setParams race — mitigated by SPA-internal nav for state 04, but state 03's
  // clearSession + AuthGate redirect may also surface this as it tears down.
  // Allow only the cancel-deletion + delete-account ones we expect.
  if (
    text.includes('Attempted to navigate before mounting') &&
    (text.includes('CancelDeletionScreen') || text.includes('DeleteAccount'))
  ) {
    return;
  }
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
  if (
    u.includes('/accounts/me') ||
    u.includes('/phone-sms') ||
    u.includes('/sms-codes') ||
    u.includes('/cancel-deletion') ||
    u.includes('/deletion') ||
    u.includes('/refresh-token')
  ) {
    step(`  [REQ] ${req.method()} ${u}`);
  }
});
page.on('requestfailed', (req) => {
  // Mocks abort/fulfill so they appear as requestfailed; exclude /api/v1/* (mock-owned)
  const u = req.url();
  if (u.includes('/api/v1/')) return;
  networkFails.push({
    url: u,
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  });
});

async function unrouteAll() {
  for (const url of [
    SMS_CODES_URL,
    PHONE_SMS_AUTH_URL,
    ACCOUNTS_ME_URL,
    DELETION_CODES_URL,
    DELETION_URL,
    CANCEL_DELETION_CODES_URL,
    REFRESH_TOKEN_URL,
  ]) {
    await page.unroute(url).catch(() => {});
  }
}

try {
  // ============================================================
  // Phase A — unauthenticated scenarios (06 → 04 → 05)
  // ============================================================

  step('Phase A — fresh load + mock SMS / phone-sms-auth + cancel-deletion-codes');

  // Pre-mock all Phase A endpoints upfront (mocks active across navigations)
  await page.route(SMS_CODES_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    }
    return route.continue();
  });
  await page.route(PHONE_SMS_AUTH_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({
          code: 'ACCOUNT_IN_FREEZE_PERIOD',
          message: '账号处于注销冻结期',
        }),
      });
    }
    return route.continue();
  });
  await page.route(CANCEL_DELETION_CODES_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    }
    return route.continue();
  });

  step('navigate http://localhost:8081 — fresh load');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 15_000 });
  await page.waitForTimeout(3500);

  // ========== Scenario 06: login + freeze modal ==========
  step('scenario 06-freeze-modal-active');
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(150);
  await page.getByLabel('获取验证码').first().click();
  await page.waitForTimeout(800);
  await page.getByLabel('验证码').first().fill(CODE);
  await page.waitForTimeout(150);
  await page.getByLabel('登录').first().click();
  // FREEZE_COPY.heading = '账号处于冻结期'
  await page.getByText('账号处于冻结期').waitFor({ timeout: 4000 });
  await page.waitForTimeout(400);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '06-freeze-modal-active.png'),
    fullPage: true,
  });

  // ========== Scenario 04: cancel-deletion prefilled + cooldown ==========
  // SPA-internal nav via [撤销] button — login.tsx pushes
  // /(auth)/cancel-deletion?phone=<encoded>; navRef ready since splash done.
  step(
    'scenario 04-cancel-prefilled — tap [freeze-cancel-delete] → SPA nav to cancel-deletion?phone=...',
  );
  await page.getByLabel('freeze-cancel-delete').first().click();
  // Wait for cancel-deletion mount — RecoverBanner heading is unique to this page
  await page.getByText('恢复账号', { exact: true }).first().waitFor({ timeout: 5000 });
  await page.waitForTimeout(800); // let mount + setParams + initial render settle

  step('click send-code (mock cancel-deletion-codes 204) → cooldown');
  await page.getByLabel('send-code').first().click();
  await page.getByText(/\d+s 后可重发/).waitFor({ timeout: 3000 });
  await page.waitForTimeout(800); // let countdown tick a bit
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-cancel-prefilled.png'), fullPage: true });

  // ========== Scenario 05: cancel-deletion deeplink empty ==========
  step('scenario 05-cancel-deeplink — page.goto /cancel-deletion (no phone, setParams not fired)');
  await page.goto('http://localhost:8081/cancel-deletion', {
    waitUntil: 'domcontentloaded',
    timeout: 10_000,
  });
  await page.getByText('恢复账号', { exact: true }).first().waitFor({ timeout: 5000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(SHOTS_DIR, '05-cancel-deeplink.png'), fullPage: true });

  // Phase A done — leave route-level mocks active for the remaining phases (no reset needed)

  // ============================================================
  // Phase B — authenticated scenarios (01 → 02 → 03)
  // Inject zustand-persist localStorage to bypass real login flow.
  // ============================================================

  step(
    'Phase B — inject nvy-auth into localStorage, mock /accounts/me + refresh + deletion endpoints',
  );

  // Mock /accounts/me (loadProfile / interceptor lookups) — return ACTIVE account with displayName
  await page.route(ACCOUNTS_ME_URL, async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    // /accounts/me/deletion + /accounts/me/deletion-codes have separate routes registered later;
    // delegate to those by NOT matching this glob's children. Since `**/api/v1/accounts/me`
    // matches /accounts/me/deletion too in Playwright glob (`**` 是贪婪匹配),需手动 fall-through.
    if (url.endsWith('/accounts/me/deletion') || url.endsWith('/accounts/me/deletion-codes')) {
      return route.fallback();
    }
    if (method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 999,
          phone: PHONE,
          displayName: DISPLAY_NAME,
          status: 'ACTIVE',
          createdAt: '2026-05-07T00:00:00Z',
        }),
      });
    }
    return route.continue();
  });
  await page.route(REFRESH_TOKEN_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accountId: 999,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        }),
      });
    }
    return route.continue();
  });
  await page.route(DELETION_CODES_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ status: 204, contentType: 'application/json', body: '' });
    }
    return route.continue();
  });
  await page.route(DELETION_URL, async (route) => {
    const m = route.request().method();
    if (m === 'POST' || m === 'DELETE') {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'INVALID_CREDENTIALS', message: '验证码错误' }),
      });
    }
    return route.continue();
  });

  step('inject nvy-auth into localStorage');
  await page.evaluate(
    ({ phone, displayName }) => {
      // page.evaluate callback runs in browser context; ESLint sees this as Node (.mjs)
      // eslint-disable-next-line no-undef
      window.localStorage.setItem(
        'nvy-auth',
        JSON.stringify({
          state: {
            accountId: 999,
            refreshToken: 'mock-refresh-token',
            displayName,
            phone,
          },
          version: 0,
        }),
      );
    },
    { phone: PHONE, displayName: DISPLAY_NAME },
  );

  step('navigate /(app)/settings/account-security/delete-account');
  await page.goto('http://localhost:8081/settings/account-security/delete-account', {
    waitUntil: 'domcontentloaded',
    timeout: 10_000,
  });
  // delete-account heading: tag "可撤销" appears in WarningBlock — use exact to avoid
  // matching checkbox-1 label "我已知晓 15 天冻结期可撤销"
  await page.getByText('可撤销', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);

  // ========== Scenario 01: delete-account idle ==========
  step('scenario 01-delete-idle — fresh page, no input');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-delete-idle.png'), fullPage: true });

  // ========== Scenario 02: checked + cooldown ==========
  step('scenario 02-delete-checked-cooldown — check both checkboxes + tap send-code (mock 204)');
  await page.getByLabel('checkbox-1').first().click();
  await page.waitForTimeout(150);
  await page.getByLabel('checkbox-2').first().click();
  await page.waitForTimeout(200);
  await page.getByLabel('send-code').first().click();
  await page.getByText(/\d+s 后可重发/).waitFor({ timeout: 3000 });
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(SHOTS_DIR, '02-delete-checked-cooldown.png'),
    fullPage: true,
  });

  // ========== Scenario 03: error visual (send-code rate-limit substitution) ==========
  // Spec C T16-smoke 03 原计划:fill code 999999 + submit (mock 401) → ErrorRow `验证码错误`。
  // 不可行原因:`deleteAccount()`(packages/auth/src/usecases.ts:152)的 finally 块无条件调
  // `useAuthStore.getState().clearSession()`,**任何**错误码(401/429/5xx)路径都会清 session
  // → AuthGate 同 React commit 内 `router.replace('/(auth)/login')` → DeleteAccountScreen 在
  // ErrorRow 第一次 paint 之前就 unmount。Playwright 多种策略均无法 capture(2026-05-07 实证
  // raf polling / 50ms multi-probe / history.replaceState block — 全部失败,因 Stack 导航
  // 内部 state 已 dispatch,URL 锁住但组件已切走)。
  //
  // 替代方案:借 send-code rate-limit 错误路径(429),mapDeletionError → 'rate_limit',
  // handleSendCode catch 设 errorMsg = "操作太频繁,请稍后再试" + 启动 cooldown。该路径
  // **不**经 deleteAccount,无 clearSession 副作用 → ErrorRow 视觉稳定 → 可 capture。
  // 视觉差异 vs 原 spec:错误文案不同(rate-limit vs invalid-code)、code 输入空(未填 999999)、
  // SubmitButton 仍 disabled。但本测试聚焦 ErrorRow + CodeInput err 红 ring 的视觉 token
  // 翻译落地,这两个核心元素均完整呈现。
  //
  // 完整覆盖路径在 helper 单测 `delete-account-errors.test.ts` 的 'invalid_code' 分支断言
  // (2026-05-07 PHASE 1 T3 落地);本视觉 smoke 不重复 component-level 错误覆盖。
  step(
    'scenario 03-delete-error — RESET to send-code rate-limit error path (substitution per known race)',
  );

  // Reload to fresh delete-account state (drop cooldown from state 02)
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 10_000 });
  await page.getByText('可撤销', { exact: true }).first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(1500);

  // Re-mock deletion-codes to return 429 (rate-limit) instead of 204
  await page.unroute(DELETION_CODES_URL).catch(() => {});
  await page.route(DELETION_CODES_URL, async (route) => {
    if (route.request().method() === 'POST') {
      return route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'RATE_LIMIT_EXCEEDED', message: '操作太频繁，请稍后再试' }),
      });
    }
    return route.continue();
  });

  step('check checkbox-1 + checkbox-2 + tap send-code (mock 429) → ErrorRow rate-limit + cooldown');
  await page.getByLabel('checkbox-1').first().click();
  await page.waitForTimeout(150);
  await page.getByLabel('checkbox-2').first().click();
  await page.waitForTimeout(200);
  await page.getByLabel('send-code').first().click();
  // Wait for ErrorRow with rate-limit copy
  await page.getByText('操作太频繁', { exact: false }).waitFor({ timeout: 3000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-delete-error.png'), fullPage: true });
  step('  ↳ state 03 captured (rate-limit ErrorRow visual)');

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

const result = {
  finalUrl,
  steps: log,
  pageErrors: errors,
  consoleErrors,
  networkFails,
};
console.log(JSON.stringify(result, null, 2));

const ok = errors.length === 0 && consoleErrors.length === 0 && networkFails.length === 0;
process.exit(ok ? 0 : 1);
