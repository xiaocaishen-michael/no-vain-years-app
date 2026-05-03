import { Pressable, Text } from 'react-native';
import { Spinner } from './Spinner';

export interface PrimaryButtonProps {
  label: string;
  loading?: boolean;
  /** form-invalid 等情况下的禁用（与 loading 视觉相同：bg-brand-300 + 不响应 press） */
  disabled?: boolean;
  onPress?: () => void;
}

export function PrimaryButton({ label, loading, disabled, onPress }: PrimaryButtonProps) {
  const inactive = !!loading || !!disabled;
  return (
    <Pressable
      disabled={inactive}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: !!loading }}
      accessibilityLabel={label}
      className={`h-12 rounded-full items-center justify-center flex-row gap-2.5 shadow-cta ${
        inactive ? 'bg-brand-300' : 'bg-brand-500 active:bg-brand-600'
      }`}
    >
      {loading ? <Spinner size={15} tone="white" /> : null}
      <Text className="text-base font-medium text-white">{label}</Text>
    </Pressable>
  );
}
