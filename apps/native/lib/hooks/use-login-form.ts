import { getAccountRegisterApi } from '@nvy/api-client';
import { loginByPassword, loginByPhoneSms } from '@nvy/auth';
import { useCallback, useEffect, useRef, useState } from 'react';

import { mapApiError } from '../validation/login';

export type LoginTab = 'password' | 'sms';
export type LoginFormState = 'idle' | 'submitting' | 'success' | 'error';
export type PlaceholderFeature = 'wechat' | 'weibo' | 'google' | 'forgot-password';

export interface UseLoginFormResult {
  tab: LoginTab;
  setTab: (tab: LoginTab) => void;
  state: LoginFormState;
  errorToast: string | null;
  smsCountdown: number;
  submitPassword: (phone: string, password: string) => Promise<void>;
  submitSms: (phone: string, smsCode: string) => Promise<void>;
  requestSms: (phone: string) => Promise<void>;
  showPlaceholderToast: (feature: PlaceholderFeature) => void;
  clearError: () => void;
}

const PLACEHOLDER_LABEL: Record<PlaceholderFeature, string> = {
  wechat: '微信登录 - Coming in M1.3',
  weibo: '微博登录 - Coming in M1.3',
  google: 'Google 登录 - Coming in M1.3',
  'forgot-password': '密码重置 - Coming in M1.3',
};

const SMS_COUNTDOWN_SECONDS = 60;

// Successful login → @nvy/auth.loginBy* sets store.session via setSession();
// AuthGate (apps/native/app/_layout.tsx) detects isAuthenticated change and
// performs router.replace('/(app)') automatically. Hook does NOT navigate.
export function useLoginForm(): UseLoginFormResult {
  const [tab, setTabState] = useState<LoginTab>('password');
  const [state, setState] = useState<LoginFormState>('idle');
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

  const clearError = useCallback(() => {
    setErrorToast(null);
    setState((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const setTab = useCallback((next: LoginTab) => {
    setTabState(next);
    setErrorToast(null);
    setState((prev) => (prev === 'error' ? 'idle' : prev));
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const mapped = mapApiError(error);
    setErrorToast(mapped.toast);
    setState('error');
  }, []);

  const submitPassword = useCallback(
    async (phone: string, password: string) => {
      setState('submitting');
      setErrorToast(null);
      try {
        await loginByPassword(phone, password);
        setState('success');
      } catch (e) {
        handleApiError(e);
      }
    },
    [handleApiError],
  );

  const submitSms = useCallback(
    async (phone: string, smsCode: string) => {
      setState('submitting');
      setErrorToast(null);
      try {
        await loginByPhoneSms(phone, smsCode);
        setState('success');
      } catch (e) {
        handleApiError(e);
      }
    },
    [handleApiError],
  );

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
      try {
        await getAccountRegisterApi().requestSmsCode({
          requestSmsCodeRequest: { phone, purpose: 'LOGIN' },
        });
        startCountdown();
      } catch (e) {
        handleApiError(e);
      }
    },
    [smsCountdown, handleApiError, startCountdown],
  );

  const showPlaceholderToast = useCallback((feature: PlaceholderFeature) => {
    setErrorToast(PLACEHOLDER_LABEL[feature]);
  }, []);

  return {
    tab,
    setTab,
    state,
    errorToast,
    smsCountdown,
    submitPassword,
    submitSms,
    requestSms,
    showPlaceholderToast,
    clearError,
  };
}
