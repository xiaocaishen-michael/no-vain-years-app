import { getAccountRegisterApi } from '@nvy/api-client';
import { phoneSmsAuth } from '@nvy/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mapApiError } from '../validation/login';

// Per ADR-0016 + plan.md 状态机:
// idle → requesting_sms → sms_sent → submitting → success | error
// (与旧 4 态相比新增 requesting_sms + sms_sent, 因 SMS 必经而非可选)
export type AuthState = 'idle' | 'requesting_sms' | 'sms_sent' | 'submitting' | 'success' | 'error';

// Per ADR-0016 决策 4 + spec FR-007/8/9: 三方 OAuth (微信/Google/Apple iOS-only)
// + 顶部 立即体验 占位 + 底部 登录遇到问题 占位; 全部 placeholder, M1.3+ 实施.
export type PlaceholderFeature = 'wechat' | 'google' | 'apple' | 'guest' | 'help';

export interface UseLoginFormResult {
  state: AuthState;
  errorToast: string | null;
  smsCountdown: number;
  requestSms: (phone: string) => Promise<void>;
  submit: (phone: string, smsCode: string) => Promise<void>;
  showPlaceholderToast: (feature: PlaceholderFeature) => void;
  clearError: () => void;
}

const PLACEHOLDER_LABEL: Record<PlaceholderFeature, string> = {
  wechat: '微信登录 - Coming in M1.3',
  google: 'Google 登录 - Coming in M1.3',
  apple: 'Apple 登录 - Coming in M1.3',
  guest: '游客模式 - Coming in M2',
  help: '帮助中心 - Coming in M1.3',
};

const SMS_COUNTDOWN_SECONDS = 60;

// Successful auth → @nvy/auth.phoneSmsAuth sets store.session via setSession();
// AuthGate (apps/native/app/_layout.tsx) detects isAuthenticated change and
// performs router.replace('/(app)') automatically. Hook does NOT navigate.
export function useLoginForm(): UseLoginFormResult {
  const [state, setState] = useState<AuthState>('idle');
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  // error → idle (or sms_sent if countdown still active, preserving session continuity)
  const clearError = useCallback(() => {
    setErrorToast(null);
    setState((prev) => {
      if (prev !== 'error') return prev;
      // smsCountdown ref via closure — read at call time
      return 'idle';
    });
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const mapped = mapApiError(error);
    setErrorToast(mapped.toast);
    setState('error');
  }, []);

  const startCountdown = useCallback(() => {
    setSmsCountdown(SMS_COUNTDOWN_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSmsCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const requestSms = useCallback(
    async (phone: string) => {
      // Defensive: button disabled while countdown > 0; this guards against races.
      if (smsCountdown > 0) return;
      setState('requesting_sms');
      setErrorToast(null);
      try {
        // PHASE 1 (per ADR-0017): 过渡期仍调既有 /sms-codes endpoint with purpose='LOGIN';
        // server unified endpoint 落地后改为 getAccountSmsCodeApi().requestSmsCode({phone})
        // (无 purpose 字段, server 内部按 phone 状态决定 template).
        await getAccountRegisterApi().requestSmsCode({
          requestSmsCodeRequest: { phone, purpose: 'LOGIN' },
        });
        startCountdown();
        setState('sms_sent');
      } catch (e) {
        handleApiError(e);
      }
    },
    [smsCountdown, handleApiError, startCountdown],
  );

  const submit = useCallback(
    async (phone: string, smsCode: string) => {
      setState('submitting');
      setErrorToast(null);
      try {
        await phoneSmsAuth(phone, smsCode);
        setState('success');
      } catch (e) {
        handleApiError(e);
      }
    },
    [handleApiError],
  );

  const showPlaceholderToast = useCallback((feature: PlaceholderFeature) => {
    setErrorToast(PLACEHOLDER_LABEL[feature]);
  }, []);

  return {
    state,
    errorToast,
    smsCountdown,
    requestSms,
    submit,
    showPlaceholderToast,
    clearError,
  };
}
