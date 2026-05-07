#!/usr/bin/env node
// T10 真后端 prod 冒烟 — account-settings-shell business flow
// per spec/account-settings-shell/tasks.md T10
//
// release v0.2.0 prod 验证;砍 logout 副作用(per ADR follow-up:M3 前必须分 staging,
// destructive case 不打 deployed env)。13 截图覆盖 only-read 路径。
//
// 流程:
//   01-login-arrived             /(auth)/login 落地
//   [人工]                       从 MOCK_SMS_RECIPIENT 邮箱拿 6 位 code 输入
//   02-onboarding                登录成功 displayName=null → AuthGate 跳 onboarding
//   03-onboarded-tabs-profile    提交 displayName → AuthGate 跳 (tabs)/profile
//   04-settings-index            tap ⚙️ → /(app)/settings
//   05-account-security          tap "账号与安全" → settings/account-security/index(phone mask 渲染)
//   06-phone-detail              tap "手机号" → settings/account-security/phone(phone mask 大字)
//   07-back-account-security     back ×1
//   08-back-settings             back ×1
//   09-legal-personal-info       tap "《个人信息收集与使用清单》"
//   10-back-settings-2           back
//   11-legal-third-party         tap "《第三方共享清单》"
//   12-back-settings-3           back
//   13-final-back-tabs-profile   back × 退栈 → 返回 (tabs)/profile
//
// 用法(README.md 详):
//   1. terminal 1 起 metro 指 prod:
//      cd apps/native && EXPO_PUBLIC_API_BASE_URL=https://api.xiaocaishen.me pnpm web
//   2. terminal 2 跑 Playwright(repo root):
//      node apps/native/runtime-debug/2026-05-07-account-settings-shell-business-flow/run.mjs
//
// prod 副作用:留 1 个测试账号(phone +8613100000007 displayName "测试用户")— 不 cleanup,
// 因为本地不连 prod DB。后续 SSH ECS 手动 cleanup,或 M3 前做 staging 分离时一并清。

import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const SMS_CODE_FILE = '/tmp/mbw-sms-code.txt';

async function waitForSmsCode(filePath, timeoutMs = 900_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const content = (await readFile(filePath, 'utf-8')).trim();
      if (/^\d{6}$/.test(content)) {
        await unlink(filePath).catch(() => {});
        return content;
      }
    } catch {
      // file not yet present, keep polling
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timeout 15min waiting for ${filePath}`);
}

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const PHONE = '+8613100000007';
const PHONE_LOCAL = '13100000007';
const DISPLAY_NAME = '测试用户';

const errors = [];
const consoleErrors = [];
const networkFails = [];
const log = [];

function step(msg) {
  log.push(`[${new Date().toISOString()}] ${msg}`);
  console.error(msg);
}

// prod nginx 没配 dev CORS for localhost:8081,Chromium preflight 会被 403。
// release 验证场景下用 --disable-web-security 跳过 CORS。Playwright 自动管 user-data-dir
// (放在 args 里它会拒绝);只传 --disable-web-security 即可。不动 prod 配置 — client-side 测试 hack。
const browser = await chromium.launch({
  headless: true,
  args: ['--disable-web-security'],
});
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await context.newPage();

page.on('console', (m) => {
  if (m.type() !== 'error' && m.type() !== 'warning') return;
  const text = m.text();
  if (text.includes('props.pointerEvents is deprecated')) return;
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
  if (
    u.includes('/accounts/me') ||
    u.includes('/phone-sms') ||
    u.includes('/sms-codes') ||
    u.includes('/auth/')
  ) {
    step(`  [REQ] ${req.method()} ${u}`);
  }
});
page.on('response', (resp) => {
  const u = resp.url();
  if (u.includes('/accounts/me') || u.includes('/phone-sms')) {
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
  step('navigate http://localhost:8081 (metro web bundle pointing at prod API)');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(8000);

  step('shot 01-login-arrived');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-login-arrived.png'), fullPage: true });

  step(`fill phone ${PHONE_LOCAL}`);
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(200);

  const envCode =
    process.env.SMS_CODE && /^\d{6}$/.test(process.env.SMS_CODE) ? process.env.SMS_CODE : null;

  if (envCode) {
    step(`SMS_CODE env set (${envCode}) — skipping 获取验证码 (reuse existing redis sms_code)`);
  } else {
    step('click 获取验证码 — prod will Resend email to MOCK_SMS_RECIPIENT');
    await page.getByLabel('获取验证码').first().click();
    await page.waitForTimeout(2500);

    console.error('\n  ============================================================');
    console.error('  >>>  WAITING for SMS code from MOCK_SMS_RECIPIENT email inbox');
    console.error(`  >>>  expected email subject: [mbw mock SMS] code for ${PHONE} [<UUID>]`);
    console.error(`  >>>  to provide code, write it to: ${SMS_CODE_FILE}`);
    console.error('  >>>      e.g.  echo 123456 > ' + SMS_CODE_FILE);
    console.error('  >>>  this script polls every 1.5s, timeout 15min');
    console.error('  ============================================================\n');
  }

  const code = envCode ?? (await waitForSmsCode(SMS_CODE_FILE));
  step(`code resolved: ${code}`);

  step(`fill code ${code}`);
  await page.getByLabel('验证码').first().fill(code);
  await page.waitForTimeout(200);

  step('click 登录 → AuthGate(displayName=null)→ /(app)/onboarding');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(5000);

  step('shot 02-onboarding');
  await page.screenshot({ path: path.join(SHOTS_DIR, '02-onboarding.png'), fullPage: true });

  step(`onboarding: fill displayName "${DISPLAY_NAME}" + submit`);
  await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
  await page.waitForTimeout(200);
  await page.getByRole('button', { name: '提交', exact: true }).first().click();
  await page.waitForTimeout(5000);

  step('shot 03-onboarded-tabs-profile (AuthGate land on (tabs)/profile)');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '03-onboarded-tabs-profile.png'),
    fullPage: true,
  });

  step('tap ⚙️ → /(app)/settings');
  await page.getByLabel('设置').first().click();
  await page.waitForTimeout(1500);
  step('shot 04-settings-index');
  await page.screenshot({ path: path.join(SHOTS_DIR, '04-settings-index.png'), fullPage: true });

  step('tap "账号与安全" → settings/account-security/index');
  await page.getByRole('button', { name: '账号与安全' }).first().click();
  await page.waitForTimeout(1500);
  step('shot 05-account-security (含 phone mask 行)');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '05-account-security.png'),
    fullPage: true,
  });

  step('tap "手机号" → settings/account-security/phone (mask 大字)');
  await page.getByRole('button', { name: '手机号' }).first().click();
  await page.waitForTimeout(1500);
  step('shot 06-phone-detail');
  await page.screenshot({ path: path.join(SHOTS_DIR, '06-phone-detail.png'), fullPage: true });

  step('back ×1 → account-security');
  await page.goBack();
  await page.waitForTimeout(1200);
  step('shot 07-back-account-security');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '07-back-account-security.png'),
    fullPage: true,
  });

  step('back ×1 → settings');
  await page.goBack();
  await page.waitForTimeout(1200);
  step('shot 08-back-settings');
  await page.screenshot({ path: path.join(SHOTS_DIR, '08-back-settings.png'), fullPage: true });

  step('tap "《个人信息收集与使用清单》" → legal/personal-info');
  await page.getByRole('link', { name: '《个人信息收集与使用清单》' }).first().click();
  await page.waitForTimeout(1500);
  step('shot 09-legal-personal-info');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '09-legal-personal-info.png'),
    fullPage: true,
  });

  step('back → settings');
  await page.goBack();
  await page.waitForTimeout(1200);
  step('shot 10-back-settings-2');
  await page.screenshot({ path: path.join(SHOTS_DIR, '10-back-settings-2.png'), fullPage: true });

  step('tap "《第三方共享清单》" → legal/third-party');
  await page.getByRole('link', { name: '《第三方共享清单》' }).first().click();
  await page.waitForTimeout(1500);
  step('shot 11-legal-third-party');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '11-legal-third-party.png'),
    fullPage: true,
  });

  step('back → settings final');
  await page.goBack();
  await page.waitForTimeout(1200);
  step('shot 12-back-settings-3');
  await page.screenshot({ path: path.join(SHOTS_DIR, '12-back-settings-3.png'), fullPage: true });

  step('back × 退栈 → (tabs)/profile');
  await page.goBack();
  await page.waitForTimeout(1500);
  step('shot 13-final-back-tabs-profile');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '13-final-back-tabs-profile.png'),
    fullPage: true,
  });

  step('=== ALL 13 SCREENSHOTS DONE ===');
  await page.waitForTimeout(3000);
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

const criticalErrors = errors.filter((e) => e.name !== 'flow');
const ok = criticalErrors.length === 0 && networkFails.length === 0;
process.exit(ok ? 0 : 1);
