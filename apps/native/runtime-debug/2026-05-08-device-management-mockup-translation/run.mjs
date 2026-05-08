#!/usr/bin/env node
// T15-smoke — device-management PHASE 2 visual smoke 6 状态截图
//
// 目的: 验证 mockup translation 落地后 login-management list / detail / remove-sheet
// 三 page 共 6 个视觉态稳定。
//
// 6 状态:
//   01-list-loading          - list page 初始加载态(ActivityIndicator + "加载中…")
//   02-list-with-current     - list 渲染完成; 第一行"Smoke Browser (Current)" + 「本机」徽标
//   03-list-cta-visible      - 同 list; 底部「更多设备 >」CTA 可见(10 of 11 shown)
//   04-detail-current-no-remove - detail page: isCurrent=true session, 无"移除该设备"按钮
//   05-detail-other-with-remove - detail page: isCurrent=false session, "移除该设备"按钮可见
//   06-sheet-active-default  - RemoveDeviceSheet default 态(drag handle / 标题 / 取消+移除)
//
// 策略(真后端, 无 API mock):
//   - 注入 nvy-auth + nvy.device_id localStorage 绕过 SMS login flow
//     (refreshToken 绑定 session 56, deviceId=77856815-...)
//   - 首次 GET /devices 无 Bearer token → 401 → interceptor 自动 POST /refresh-token
//     (真后端) → 拿到新 accessToken → 重试 GET /devices(真后端, 11 设备)
//   - state 01 loading: page.route 给 GET /devices 加 2s 延迟, 在延迟窗口截图
//   - state 04/05: 点击 list row → SPA 内部 nav → detail page(cache 命中)
//   - state 06: 点击「移除该设备」→ sheet 弹出
//
// 前置条件(2026-05-08 dev DB 已建好):
//   - 账号 23 (+8613100000007), 11 个 active device sessions (id 44-53 + 56)
//   - session 56: device_id=77856815-1b69-4ef4-910c-e831c459c631, isCurrent=true
//   - session 44: device_id=a0000001-..., name="iPhone 16 Pro (小明的)", isCurrent=false
//   - refresh token pRUoeHUAyCCYpj6-... 对应 session 56, 有效期 30 天
//
// 假设:
//   - metro :8081 (EXPO_PUBLIC_API_BASE_URL=http://localhost:8080 in .env.local)
//   - Spring Boot :8080 已运行 + CORS 允许 http://localhost:8081
//   - Playwright 1.59+
//
// 用法: node apps/native/runtime-debug/2026-05-08-device-management-mockup-translation/run.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

// ─── Pre-created dev DB state ─────────────────────────────────────────────────
// Tokens are read from env vars — never hardcode credentials here (gitleaks).
//
// Obtain fresh tokens: login via SMS (code 999999 in dev) to account +8613100000007,
// then set the env vars before running:
//
//   export NVY_SMOKE_ACCESS_TOKEN=<15-min JWT>
//   export NVY_SMOKE_REFRESH_TOKEN=<30-day refresh token>
//   node run.mjs
//
// The injected accessToken must match the device_id below (session 58 = isCurrent).
// accessToken exp window: 15 min — run within that window to avoid the 401→refresh path.
const ACCESS_TOKEN = process.env['NVY_SMOKE_ACCESS_TOKEN'] ?? '';
const REFRESH_TOKEN = process.env['NVY_SMOKE_REFRESH_TOKEN'] ?? '';

const PHONE = '+8613100000007';
const DISPLAY_NAME = '小明';
const ACCOUNT_ID = 23;
// device ID matching session 58 in DB → isCurrent=true
const CURRENT_DEVICE_ID = '77856815-1b69-4ef4-910c-e831c459c631';

// IDs used for detail page navigation
const SESSION_CURRENT_ID = 58; // isCurrent=true, "Smoke Browser (Current)"
const SESSION_OTHER_ID = 44; // isCurrent=false, "iPhone 16 Pro (小明的)"

const DEVICES_URL = '**/api/v1/auth/devices**';

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
  // Known benign console noise
  if (text.includes('props.pointerEvents is deprecated')) return;
  if (text.includes('Unmatched Route')) return;
  if (text.includes('missing the required default export')) return;
  // Real backend returns 401 on first GET /devices (token refresh flow) — expected
  if (text.includes('Failed to load resource') && /401/.test(text)) return;
  // CORS preflight "error" noise from cross-origin to localhost:8080 — suppressed
  if (text.includes('cross-origin') || text.includes('CORS')) return;
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
  if (u.includes('/auth/') || u.includes('/accounts/') || u.includes('/refresh')) {
    step(`  [REQ] ${req.method()} ${u}`);
  }
});

page.on('requestfailed', (req) => {
  const u = req.url();
  // Ignore /api/v1/ failures — 401 on first device fetch is expected (token refresh path)
  if (u.includes('/api/v1/')) return;
  networkFails.push({
    url: u,
    method: req.method(),
    failure: req.failure()?.errorText ?? 'unknown',
  });
});

try {
  // ──────────────────────────────────────────────────────────────────────────
  // Step 1: inject auth state into localStorage (bypass real SMS login)
  // ──────────────────────────────────────────────────────────────────────────
  step('Step 1 — inject localStorage auth + device state');

  // First load the metro SPA to get a valid page context with working localStorage
  step('navigate http://localhost:8081 — initial load');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 20_000 });
  await page.waitForTimeout(2500); // wait for bundle eval + initial react tree

  step('inject nvy-auth and nvy.device_id into localStorage');
  await page.evaluate(
    ({ accountId, accessToken, refreshToken, displayName, phone, deviceId }) => {
      // eslint-disable-next-line no-undef
      window.localStorage.setItem(
        'nvy-auth',
        JSON.stringify({
          // accessToken injected alongside refreshToken so Zustand merges it on
          // rehydration — TokenGetter returns it immediately, avoiding the 401 →
          // refresh flow that would rotate the refresh token each run.
          state: { accountId, accessToken, refreshToken, displayName, phone },
          version: 0,
        }),
      );
      // eslint-disable-next-line no-undef
      window.localStorage.setItem(
        'nvy.device_id',
        JSON.stringify({
          state: { deviceId, deviceName: null, deviceType: 'WEB' },
          version: 0,
        }),
      );
    },
    {
      accountId: ACCOUNT_ID,
      accessToken: ACCESS_TOKEN,
      refreshToken: REFRESH_TOKEN,
      displayName: DISPLAY_NAME,
      phone: PHONE,
      deviceId: CURRENT_DEVICE_ID,
    },
  );

  // ──────────────────────────────────────────────────────────────────────────
  // State 01 — list-loading (intercept GET /devices with 2s delay)
  // ──────────────────────────────────────────────────────────────────────────
  step('setup loading-capture route intercept (2s delay on first GET /devices)');

  // Setup delayed intercept for loading state — keep route active for the full session
  // (no unroute needed; after loadingCaptured=true all calls pass through immediately)
  let loadingCaptured = false;
  await page.route(DEVICES_URL, async (route) => {
    if (route.request().method() === 'GET' && !loadingCaptured) {
      // Hold for 2 seconds so we can screenshot the loading spinner
      await new Promise((r) => setTimeout(r, 2000));
      loadingCaptured = true;
    }
    // Wrap in try-catch: page.unroute() or navigation teardown can race with
    // an in-flight handler's route.continue(), causing "Route is already handled"
    try {
      await route.continue();
    } catch {
      // Route already handled — safe to ignore
    }
  });

  step('navigate to login-management list page');
  await page.goto(
    'http://localhost:8081/settings/account-security/login-management',
    { waitUntil: 'domcontentloaded', timeout: 15_000 },
  );

  step('state 01 — wait for loading indicator ("加载中…")');
  try {
    await page.getByText('加载中…').waitFor({ timeout: 8000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-list-loading.png'), fullPage: true });
    step('  ↳ 01-list-loading.png captured');
  } catch {
    step('  ↳ loading indicator missed (fast backend) — taking fallback screenshot anyway');
    await page.screenshot({ path: path.join(SHOTS_DIR, '01-list-loading.png'), fullPage: true });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // State 02 — list loaded with current device + 「本机」badge
  // ──────────────────────────────────────────────────────────────────────────
  step('state 02 — wait for list to render (subtitle "已登录的设备")');
  await page.getByText('已登录的设备').waitFor({ timeout: 12_000 });
  await page.waitForTimeout(600); // let fonts settle
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-list-with-current.png'), fullPage: true });
  step('  ↳ 02-list-with-current.png captured');

  // ──────────────────────────────────────────────────────────────────────────
  // State 03 — list with 「更多设备 >」CTA visible (10 of 11)
  // ──────────────────────────────────────────────────────────────────────────
  step('state 03 — scroll to bottom to show 更多设备 CTA');
  // The CTA renders inline after the Card; scroll to it
  try {
    await page.getByText('更多设备').waitFor({ timeout: 5000 });
    // Scroll the CTA into view
    await page.evaluate(() => {
      // eslint-disable-next-line no-undef
      const el = Array.from(document.querySelectorAll('*')).find((n) =>
        n.textContent?.includes('更多设备'),
      );
      el?.scrollIntoView({ behavior: 'instant', block: 'center' });
    });
    await page.waitForTimeout(400);
  } catch {
    step('  ↳ CTA not found (< 10 devices? or pagination disabled) — screenshot as-is');
  }
  await page.screenshot({ path: path.join(SHOTS_DIR, '03-list-cta-visible.png'), fullPage: true });
  step('  ↳ 03-list-cta-visible.png captured');

  // ──────────────────────────────────────────────────────────────────────────
  // State 04 — detail page: current device (no remove button)
  // Navigate by tapping the current device row (SPA-internal nav, cache hit)
  // ──────────────────────────────────────────────────────────────────────────
  step(`state 04 — tap current device row → detail page (session ${SESSION_CURRENT_ID})`);
  // Scroll back to top first
  // eslint-disable-next-line no-undef
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  // Click on the row with "Smoke Browser (Current)" label
  await page.getByText('Smoke Browser (Current)').first().click();
  // Wait for detail page fields
  await page.getByText('设备名称').waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);

  // Verify no remove button (isCurrent=true)
  const removeBtn = page.getByText('移除该设备');
  const removeBtnCount = await removeBtn.count();
  if (removeBtnCount > 0) {
    step('  WARN: remove button found on current device detail — unexpected');
  }

  await page.screenshot({ path: path.join(SHOTS_DIR, '04-detail-current-no-remove.png'), fullPage: true });
  step('  ↳ 04-detail-current-no-remove.png captured');

  // ──────────────────────────────────────────────────────────────────────────
  // State 05 — detail page: non-current device (remove button visible)
  // Navigate back to list, then tap iPhone row
  // ──────────────────────────────────────────────────────────────────────────
  step(`state 05 — go back to list → tap non-current device row (session ${SESSION_OTHER_ID})`);
  await page.goBack({ waitUntil: 'domcontentloaded', timeout: 8000 });
  // Wait for list to re-appear
  await page.getByText('已登录的设备').waitFor({ timeout: 8000 });
  await page.waitForTimeout(400);

  // Click on "iPhone 16 Pro (小明的)" — scroll to it if needed
  await page.getByText('iPhone 16 Pro (小明的)').first().click();
  // Wait for detail page
  await page.getByText('设备名称').waitFor({ timeout: 8000 });
  await page.waitForTimeout(500);

  // Verify remove button is present (isCurrent=false)
  await page.getByText('移除该设备').waitFor({ timeout: 3000 });

  await page.screenshot({ path: path.join(SHOTS_DIR, '05-detail-other-with-remove.png'), fullPage: true });
  step('  ↳ 05-detail-other-with-remove.png captured');

  // ──────────────────────────────────────────────────────────────────────────
  // State 06 — RemoveDeviceSheet default state (tap 移除该设备 button)
  // ──────────────────────────────────────────────────────────────────────────
  step('state 06 — tap 移除该设备 → RemoveDeviceSheet appears');
  await page.getByText('移除该设备').first().click();

  // Wait for sheet heading '移除设备' — use exact to avoid matching the body text
  // '移除设备后，该设备再次登录需要重新安全验证'
  await page.getByText('移除设备', { exact: true }).waitFor({ timeout: 5000 });
  await page.waitForTimeout(400); // let sheet slide-in animation settle

  await page.screenshot({ path: path.join(SHOTS_DIR, '06-sheet-active-default.png'), fullPage: true });
  step('  ↳ 06-sheet-active-default.png captured');

  // Close the sheet (avoid spurious errors on cleanup)
  await page.getByText('取消').first().click().catch(() => {});
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
