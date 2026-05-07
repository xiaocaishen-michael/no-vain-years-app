// preview/OnboardingScreen.preview.jsx — browser-loadable mirror of OnboardingScreen.tsx
// Single-field onboarding; 4 states (idle / submitting / success / error).

function OB_Spinner({ size = 16, tone = "white" }) {
  const r = useSharedValue(0);
  React.useEffect(() => {
    r.value = withRepeat(withTiming(360, { duration: 700, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  const ringTone =
    tone === "white" ? "border-white/30 border-t-white" :
    tone === "brand" ? "border-brand-200 border-t-brand-500" :
                       "border-line border-t-ink-subtle";
  return (
    <Animated.View
      style={[{ width: size, height: size }, style]}
      className={`rounded-full border-[2px] ${ringTone}`}
    />
  );
}

function OB_SuccessCheck() {
  const s = useSharedValue(0);
  React.useEffect(() => {
    s.value = withSequence(
      withTiming(1.1, { duration: 240, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 140, easing: Easing.out(Easing.cubic) }),
    );
  }, []);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
    opacity: s.value === 0 ? 0 : 1,
  }));
  return (
    <Animated.View style={style} className="rounded-full bg-ok-soft items-center justify-center" >
      <View className="rounded-full bg-ok items-center justify-center" style={{ width: 64, height: 64 }}>
        <Text className="text-white text-3xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}

function OB_LogoMark() {
  return (
    <View style={{ width: 40, height: 40 }}>
      <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="14" fill="#2456E5"/>
        <circle cx="32" cy="32" r="22" fill="#FF8C00" opacity="0.18"/>
        <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
          <path d="M32 18 L32 8"/><path d="M39 19.88 L44 11.22"/><path d="M44.12 25 L52.78 20"/>
          <path d="M46 32 L56 32"/><path d="M44.12 39 L52.78 44"/><path d="M39 44.12 L44 52.78"/>
          <path d="M32 46 L32 56"/><path d="M25 44.12 L20 52.78"/><path d="M19.88 39 L11.22 44"/>
          <path d="M18 32 L8 32"/><path d="M19.88 25 L11.22 20"/><path d="M25 19.88 L20 11.22"/>
        </g>
        <circle cx="32" cy="32" r="9.5" fill="#FF8C00"/>
        <circle cx="29.5" cy="29.5" r="2.5" fill="#FFFFFF" opacity="0.3"/>
      </svg>
    </View>
  );
}

function OB_DisplayNameInput({ value, onChangeText, disabled, errored }) {
  const [focused, setFocused] = React.useState(false);
  const tone = errored ? "border-err" : focused ? "border-brand-500" : "border-line";
  const len = [...value].length;
  return (
    <View>
      <View
        className={`flex-row items-center border-b ${tone} ${disabled ? "opacity-60" : ""}`}
        style={{ height: 48 }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={!disabled}
          maxLength={32}
          placeholder="给自己起个昵称"
          placeholderTextColor="#999999"
          className="flex-1 text-base text-ink font-sans"
        />
        <Text className={`text-xs font-mono pl-2 ${len > 32 ? "text-err" : "text-ink-subtle"}`}>
          {len}/32
        </Text>
      </View>
      <Text className="text-xs text-ink-subtle mt-1.5">
        1 至 32 字符，支持中文 / 字母 / 数字 / emoji
      </Text>
    </View>
  );
}

function OB_ErrorRow({ text }) {
  return (
    <View className="flex-row items-center gap-1.5 mt-1.5">
      <View className="rounded-full bg-err items-center justify-center" style={{ width: 14, height: 14 }}>
        <Text className="text-white text-[10px] font-bold leading-none">!</Text>
      </View>
      <Text className="text-xs text-err">{text}</Text>
    </View>
  );
}

function OB_PrimaryButton({ label, loading, disabled, onPress }) {
  const bg = disabled ? "bg-brand-soft" : loading ? "bg-brand-300" : "bg-brand-500";
  const fg = disabled ? "text-brand-300" : "text-white";
  return (
    <Pressable
      disabled={disabled || loading} onPress={onPress}
      className={`rounded-full items-center justify-center flex-row gap-2 shadow-cta ${bg}`}
      style={{ height: 48 }}
    >
      {loading ? <OB_Spinner size={15} tone="white"/> : null}
      <Text className={`text-base font-medium ${fg}`}>{label}</Text>
    </Pressable>
  );
}

function OB_SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <View className="flex-1 items-center justify-center gap-4 pb-20">
        <OB_SuccessCheck/>
        <Text className="text-xl font-semibold text-ink mt-2">完成！</Text>
        <View className="flex-row items-center gap-2">
          <OB_Spinner size={12} tone="muted"/>
          <Text className="text-sm text-ink-muted">正在进入今日时间线…</Text>
        </View>
      </View>
    </View>
  );
}

function OnboardingScreen({ state = "idle", onSubmit }) {
  const [name, setName] = React.useState(
    state === "error" ? "@@bad_name" :
    state === "submitting" ? "时间旅人" : ""
  );
  const submitting = state === "submitting";
  const errored = state === "error";
  const trimmed = name.trim();
  const len = [...trimmed].length;
  const valid = len >= 1 && len <= 32;
  const ctaDisabled = !valid;
  const errorText = errored ? "昵称不合法，请使用中文 / 字母 / 数字 / emoji" : null;

  if (state === "success") return <OB_SuccessOverlay/>;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <View className="flex-row items-center" style={{ height: 44 }}/>

      <View className="mt-4 items-center gap-3">
        <OB_LogoMark/>
        <Text className="text-3xl font-bold text-ink tracking-tight text-center" style={{ fontSize: 28 }}>完善个人资料</Text>
        <Text className="text-sm text-ink-muted leading-relaxed text-center">起一个昵称，随时可在设置里修改。</Text>
      </View>

      <View className="mt-9">
        <OB_DisplayNameInput value={name} onChangeText={setName} disabled={submitting} errored={errored}/>
        {errorText ? <OB_ErrorRow text={errorText}/> : null}
      </View>

      <View className="mt-7">
        <OB_PrimaryButton
          label={submitting ? "提交中…" : "提交"}
          loading={submitting}
          disabled={ctaDisabled && !submitting}
          onPress={() => valid && onSubmit?.(trimmed)}
        />
      </View>

      <View className="flex-1"/>

      <Text className="text-center text-[11px] text-ink-subtle mb-2">
        昵称可在「设置」中随时修改
      </Text>
    </View>
  );
}

window.OnboardingScreen = OnboardingScreen;
