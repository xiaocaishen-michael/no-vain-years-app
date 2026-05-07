import { updateDisplayName } from '@nvy/auth';
import { useCallback, useMemo, useState } from 'react';

import { displayNameSchema, mapOnboardingApiError } from '../validation/onboarding';

// Per onboarding spec FR-008 4-state machine: idle → submitting → (success | error).
// Hook does NOT navigate on success — AuthGate observes store.displayName via
// setDisplayName (written by @nvy/auth.updateDisplayName) and routes to /(app)/(tabs)/profile.
export type OnboardingStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface UseOnboardingFormResult {
  displayName: string;
  setDisplayName: (value: string) => void;
  submit: () => Promise<void>;
  status: OnboardingStatus;
  errorMessage: string | null;
  // True when the trimmed input passes displayNameSchema and we're not in-flight.
  // UI binds this to <Pressable disabled={!isSubmittable}> + accessibilityState.
  isSubmittable: boolean;
}

export function useOnboardingForm(): UseOnboardingFormResult {
  const [displayName, setDisplayNameState] = useState('');
  const [status, setStatus] = useState<OnboardingStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isFormValid = useMemo(
    () => displayNameSchema.safeParse(displayName).success,
    [displayName],
  );
  const isSubmittable = isFormValid && status !== 'submitting';

  const setDisplayName = useCallback(
    (value: string) => {
      setDisplayNameState(value);
      // Any input change clears the error and returns to idle (FR-008).
      if (status === 'error' || errorMessage !== null) {
        setStatus('idle');
        setErrorMessage(null);
      }
    },
    [status, errorMessage],
  );

  const submit = useCallback(async () => {
    const parsed = displayNameSchema.safeParse(displayName);
    if (!parsed.success) return;
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage(null);
    try {
      await updateDisplayName(parsed.data);
      setStatus('success');
    } catch (err) {
      const mapped = mapOnboardingApiError(err);
      setErrorMessage(mapped.toast);
      setStatus('error');
    }
  }, [displayName, status]);

  return { displayName, setDisplayName, submit, status, errorMessage, isSubmittable };
}
