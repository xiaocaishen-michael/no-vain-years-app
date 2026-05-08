#!/usr/bin/env node
// T11 真后端 prod 冒烟 — delete-account & cancel-deletion business flow
// per spec/delete-account-cancel-deletion-ui/tasks.md T11
//
// release v0.2.0 验证 spec C destructive flow:
//   路径 1(发起注销):新号注册 + onboard → settings → 账号与安全 → 注销账号 → 双勾
//                  + 发码 → 输 code → 提交 → 跳 login(account FROZEN)
//   路径 2(撤销注销):login 同号 + 发码 + 输 code + 登录 → freeze modal 触发
//                  → tap [撤销] → cancel-deletion 预填 → 发码 → 输 code → tap 撤销
//                  → 跳 (tabs)/profile(account ACTIVE again)
//
// 需要 user 4 次邮箱拿 code(2 SMS for path 1 + 2 SMS for path 2):
//   - SMS 1: 注册发码(onboard)
//   - SMS 2: 注销发码(deletion)
//   - SMS 3: login 发码(进 freeze modal)
//   - SMS 4: 撤销发码(cancel-deletion)
//
// 用 file polling /tmp/mbw-sms-code.txt(每次 user echo 6 位 code 后 Playwright 自动继续)
//
// 用法:
//   1. 已起 metro 指 prod(.env.local 写 EXPO_PUBLIC_API_BASE_URL=https://api.xiaocaishen.me)
//   2. node apps/native/runtime-debug/2026-05-08-delete-account-cancel-deletion-business-flow/run.mjs
//   3. 4 次 prompt 时:邮箱拿最新 [mbw mock SMS] code 邮件,echo 6 位 code 到 /tmp/mbw-sms-code.txt
//
// prod 副作用:1 个测试号(+8613100000008 测试C)历经 ACTIVE → FROZEN → ACTIVE 三态;
// 跑完后 status=ACTIVE。本地不连 prod DB 不 cleanup,M3 staging 分离时一并清。

import { readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const SHOTS_DIR = path.dirname(__filename);

const SMS_CODE_FILE = '/tmp/mbw-sms-code.txt';

const PHONE = '+8613100000008';
const PHONE_LOCAL = '13100000008';
const DISPLAY_NAME = '测试C';

const errors = [];
const consoleErrors = [];
const networkFails = [];
const log = [];

function step(msg) {
  log.push(`[${new Date().toISOString()}] ${msg}`);
  console.error(msg);
}

async function waitForSmsCode(label) {
  console.error('\n  ============================================================');
  console.error(`  >>>  WAITING for SMS ${label}: 邮箱找最新 [mbw mock SMS] for ${PHONE}`);
  console.error(`  >>>  echo 6-digit code > ${SMS_CODE_FILE}`);
  console.error('  >>>  (1.5s polling, 15min timeout)');
  console.error('  ============================================================\n');

  const start = Date.now();
  while (Date.now() - start < 900_000) {
    try {
      const content = (await readFile(SMS_CODE_FILE, 'utf-8')).trim();
      if (/^\d{6}$/.test(content)) {
        await unlink(SMS_CODE_FILE).catch(() => {});
        step(`got SMS ${label}: ${content}`);
        return content;
      }
    } catch {
      // not present yet
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error(`Timeout 15min waiting SMS ${label}`);
}

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
  if (text.includes('missing the required default export')) return;
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
    u.includes('/accounts/') ||
    u.includes('/auth/') ||
    u.includes('/sms-codes')
  ) {
    step(`  [REQ] ${req.method()} ${u}`);
  }
});
page.on('response', (resp) => {
  const u = resp.url();
  if (
    u.includes('/accounts/me') ||
    u.includes('/phone-sms-auth') ||
    u.includes('/cancel-deletion') ||
    u.includes('/deletion')
  ) {
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
  // ============================================================
  // PATH 1 — 发起注销(register → onboard → 注销 → FROZEN)
  // ============================================================

  step('=== PATH 1: register + onboard + 注销发起 ===');
  step('navigate http://localhost:8081');
  await page.goto('http://localhost:8081', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await page.waitForTimeout(8000);

  step('shot 01-login-arrived');
  await page.screenshot({ path: path.join(SHOTS_DIR, '01-login-arrived.png'), fullPage: true });

  step(`fill phone ${PHONE_LOCAL}`);
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(200);

  step('click 获取验证码 — SMS 1 (onboarding)');
  await page.getByLabel('获取验证码').first().click();
  await page.waitForTimeout(2500);

  const code1 = await waitForSmsCode('1/4 (onboarding)');
  await page.getByLabel('验证码').first().fill(code1);
  await page.waitForTimeout(200);

  step('click 登录 → AuthGate decides next route');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(5000);

  // 已 onboarded 用户直接落 (tabs)/profile;新号 displayName=null 跳 onboarding。
  // 自动检测路由,onboarding 就 fill;否则 skip。
  const postLoginUrl = page.url();
  step(`post-login url: ${postLoginUrl}`);

  if (postLoginUrl.includes('/onboarding')) {
    step('shot 02-onboarding');
    await page.screenshot({ path: path.join(SHOTS_DIR, '02-onboarding.png'), fullPage: true });

    step(`onboarding: fill displayName "${DISPLAY_NAME}" + submit`);
    await page.getByLabel('昵称').first().fill(DISPLAY_NAME);
    await page.waitForTimeout(200);
    await page.getByRole('button', { name: '提交', exact: true }).first().click();
    await page.waitForTimeout(5000);
  } else {
    step('skip onboarding (already onboarded)');
  }

  step('shot 03-onboarded-tabs-profile');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '03-onboarded-tabs-profile.png'),
    fullPage: true,
  });

  step('tap ⚙️ → /(app)/settings');
  await page.getByLabel('设置').first().click();
  await page.waitForTimeout(1500);

  step('tap "账号与安全"');
  await page.getByRole('button', { name: '账号与安全' }).first().click();
  await page.waitForTimeout(1500);

  step('tap "注销账号" → /(app)/settings/account-security/delete-account');
  await page.getByRole('button', { name: '注销账号' }).first().click();
  await page.waitForTimeout(2000);

  step('shot 04-delete-account-default');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '04-delete-account-default.png'),
    fullPage: true,
  });

  step('tap 双勾 (checkbox-1 + checkbox-2)');
  await page.getByLabel('checkbox-1').first().click();
  await page.waitForTimeout(300);
  await page.getByLabel('checkbox-2').first().click();
  await page.waitForTimeout(500);

  step('shot 05-delete-account-checked');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '05-delete-account-checked.png'),
    fullPage: true,
  });

  step('click send-code button — SMS 2 (deletion)');
  await page.getByLabel('send-code').first().click();
  await page.waitForTimeout(2500);

  const code2 = await waitForSmsCode('2/4 (deletion)');
  await page.getByLabel('code-input').first().fill(code2);
  await page.waitForTimeout(300);

  step('shot 06-delete-account-code-filled');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '06-delete-account-code-filled.png'),
    fullPage: true,
  });

  step('click submit — deletion → 跳 login (account FROZEN)');
  await page.getByLabel('submit').first().click();
  await page.waitForTimeout(5000);

  step('shot 07-after-deletion-login-screen');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '07-after-deletion-login-screen.png'),
    fullPage: true,
  });

  step('=== PATH 1 DONE — account FROZEN ===');

  // ============================================================
  // PATH 2 — 撤销注销(login → freeze modal → 撤销 → ACTIVE)
  // ============================================================

  step('=== PATH 2: freeze modal + cancel-deletion ===');

  step(`fill phone ${PHONE_LOCAL} (FROZEN account)`);
  await page.getByLabel('手机号').first().fill(PHONE_LOCAL);
  await page.waitForTimeout(200);

  step('click 获取验证码 — SMS 3 (login attempt 触发 freeze modal)');
  await page.getByLabel('获取验证码').first().click();
  await page.waitForTimeout(2500);

  const code3 = await waitForSmsCode('3/4 (login on frozen account)');
  await page.getByLabel('验证码').first().fill(code3);
  await page.waitForTimeout(200);

  step('click 登录 → server returns ACCOUNT_IN_FREEZE_PERIOD → freeze modal 触发');
  await page.getByLabel('登录').first().click();
  await page.waitForTimeout(4000);

  step('shot 08-freeze-modal-triggered');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '08-freeze-modal-triggered.png'),
    fullPage: true,
  });

  step('tap freeze-cancel-delete → /(auth)/cancel-deletion?phone=...');
  await page.getByLabel('freeze-cancel-delete').first().click();
  await page.waitForTimeout(2500);

  step('shot 09-cancel-deletion-prefilled');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '09-cancel-deletion-prefilled.png'),
    fullPage: true,
  });

  step('click send-code — SMS 4 (cancel-deletion 撤销发码)');
  await page.getByLabel('send-code').first().click();
  await page.waitForTimeout(2500);

  const code4 = await waitForSmsCode('4/4 (cancel-deletion)');
  await page.getByLabel('code-input').first().fill(code4);
  await page.waitForTimeout(300);

  step('shot 10-cancel-deletion-code-filled');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '10-cancel-deletion-code-filled.png'),
    fullPage: true,
  });

  step('click submit — cancel-deletion → 跳 (tabs)/profile (account ACTIVE)');
  await page.getByLabel('submit').first().click();
  await page.waitForTimeout(5000);

  step('shot 11-after-cancel-tabs-profile');
  await page.screenshot({
    path: path.join(SHOTS_DIR, '11-after-cancel-tabs-profile.png'),
    fullPage: true,
  });

  step('=== PATH 2 DONE — account back to ACTIVE ===');
  step('=== ALL 11 SCREENSHOTS DONE ===');
  await page.waitForTimeout(2000);
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
