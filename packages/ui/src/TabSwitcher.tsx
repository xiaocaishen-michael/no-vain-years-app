import { Pressable, Text, View } from 'react-native';

export interface TabOption<T extends string> {
  key: T;
  label: string;
}

export interface TabSwitcherProps<T extends string> {
  value: T;
  onChange: (val: T) => void;
  options: ReadonlyArray<TabOption<T>>;
  disabled?: boolean;
}

// B 站 / 微博风格：下划线条跟随选中 tab；适用于双 / 三 tab 切换。
export function TabSwitcher<T extends string>({
  value,
  onChange,
  options,
  disabled,
}: TabSwitcherProps<T>) {
  return (
    <View className="flex-row gap-7" accessibilityRole="tablist">
      {options.map((opt) => {
        const on = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            onPress={() => !disabled && onChange(opt.key)}
            disabled={disabled}
            className="pb-2"
            accessibilityRole="tab"
            accessibilityState={{ selected: on, disabled: !!disabled }}
            accessibilityLabel={opt.label}
          >
            <Text
              className={
                on ? 'text-lg font-semibold text-ink' : 'text-base font-medium text-ink-subtle'
              }
            >
              {opt.label}
            </Text>
            {on ? (
              <View className="absolute left-0 right-0 bottom-0 h-1 bg-brand-500 rounded-full" />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
