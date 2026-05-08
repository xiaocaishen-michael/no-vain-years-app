// preview/LoginScreen.preview.jsx — browser-loadable mirror of LoginScreen.tsx (v2)
// Unified phone-SMS auth, no tabs, no password, no register.
// 5-state: idle / requesting_sms / sms_sent / submitting / success / error.

function Spinner({ size = 16, tone = "white" }) {
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

function SuccessCheck() {
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
      <View className="rounded-full bg-ok items-center justify-center" style={{ width: 56, height: 56 }}>
        <Text className="text-white text-2xl font-bold">✓</Text>
      </View>
    </Animated.View>
  );
}

function useCountdown(seconds, active) {
  const [n, setN] = React.useState(seconds);
  React.useEffect(() => {
    if (!active) { setN(seconds); return; }
    setN(seconds);
    const id = setInterval(() => { setN(v => v <= 1 ? 0 : v - 1); }, 1000);
    return () => clearInterval(id);
  }, [active, seconds]);
  return n;
}

function PhoneInput({ value, onChangeText, disabled, errored }) {
  const [focused, setFocused] = React.useState(false);
  const tone = errored ? "border-err" : focused ? "border-brand-500" : "border-line";
  return (
    <View
      className={`flex-row items-center border-b ${tone} ${disabled ? "opacity-60" : ""}`}
      style={{ height: 48 }}
    >
      <View className="flex-row items-center gap-1 pr-2">
        <Text className="text-base font-medium text-ink">+86</Text>
        <Text className="text-xs text-ink-subtle">▾</Text>
      </View>
      <View className="bg-line mr-3" style={{ width: 1, height: 16 }}/>
      <TextInput
        value={value} onChangeText={onChangeText}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        editable={!disabled}
        placeholder="请输入手机号"
        placeholderTextColor="#999999"
        keyboardType="phone-pad"
        className="flex-1 text-base text-ink font-sans tracking-wide"
      />
    </View>
  );
}

function SmsInput({ value, onChangeText, errored, requesting, ticking, countdown, onSend, disabled }) {
  const [focused, setFocused] = React.useState(false);
  const tone = errored ? "border-err" : focused ? "border-brand-500" : "border-line";
  return (
    <View className={`flex-row items-center border-b ${tone}`} style={{ height: 48 }}>
      <TextInput
        value={value} onChangeText={onChangeText}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        editable={!disabled}
        placeholder="请输入 6 位验证码"
        placeholderTextColor="#999999"
        maxLength={6} keyboardType="number-pad"
        className="flex-1 text-base text-ink font-sans tracking-widest"
      />
      <Pressable disabled={requesting || ticking} onPress={onSend} className="flex-row items-center gap-2 pl-2">
        {requesting ? (
          <React.Fragment>
            <Spinner size={11} tone="muted"/>
            <Text className="text-sm text-ink-subtle font-medium">发送中…</Text>
          </React.Fragment>
        ) : ticking ? (
          <Text className="text-sm text-ink-subtle font-medium font-mono">{countdown}s 后重发</Text>
        ) : (
          <Text className="text-sm text-brand-500 font-medium">获取验证码</Text>
        )}
      </Pressable>
    </View>
  );
}

function ErrorRow({ text }) {
  return (
    <View className="flex-row items-center gap-1.5 mt-1.5">
      <View className="rounded-full bg-err items-center justify-center" style={{ width: 14, height: 14 }}>
        <Text className="text-white text-[10px] font-bold leading-none">!</Text>
      </View>
      <Text className="text-xs text-err">{text}</Text>
    </View>
  );
}

function PrimaryButton({ label, loading, disabled, onPress }) {
  const bg = disabled ? "bg-brand-200" : loading ? "bg-brand-300" : "bg-brand-500";
  return (
    <Pressable
      disabled={disabled || loading} onPress={onPress}
      className={`rounded-full items-center justify-center flex-row gap-2 shadow-cta ${bg}`}
      style={{ height: 48 }}
    >
      {loading ? <Spinner size={15} tone="white"/> : null}
      <Text className="text-base font-medium text-white">{label}</Text>
    </Pressable>
  );
}

function OAuthCircle({ bg, label, children, onPress, disabled }) {
  return (
    <View className="items-center gap-1.5">
      <Pressable
        onPress={onPress} disabled={disabled}
        className={`rounded-full items-center justify-center ${bg} ${disabled ? "opacity-50" : ""}`}
        style={{ width: 48, height: 48 }}
      >
        {children}
      </Pressable>
      <Text className="text-[11px] text-ink-subtle">{label}</Text>
    </View>
  );
}

function WeChatGlyph() {
  // Two overlapping speech bubbles, classic WeChat
  return (
    <svg width="26" height="26" viewBox="0 0 28 28" fill="none">
      {/* Big bubble (back) */}
      <path
        d="M11 5C5.9 5 2 8.5 2 12.7c0 2.4 1.4 4.5 3.5 5.9l-.6 2.6 3.1-1.6c.94.18 1.93.28 2.95.28.32 0 .64-.01.95-.04C11.7 19.55 11.5 18.7 11.5 17.8c0-3.7 3.6-6.7 8-6.7.45 0 .9.03 1.34.09C20.05 7.45 16 5 11 5Z"
        fill="#fff"
      />
      {/* Eyes on big bubble */}
      <circle cx="8.2" cy="11.2" r="1.05" fill="#07C160"/>
      <circle cx="13.8" cy="11.2" r="1.05" fill="#07C160"/>
      {/* Small bubble (front) */}
      <path
        d="M27 18.5c0-3.05-3.13-5.5-7-5.5s-7 2.45-7 5.5c0 3.05 3.13 5.5 7 5.5.7 0 1.36-.08 2-.23l2.5 1.4-.55-2.1c1.85-1 3.05-2.55 3.05-4.57Z"
        fill="#fff"
      />
      <circle cx="17.5" cy="18.2" r="0.9" fill="#07C160"/>
      <circle cx="22.5" cy="18.2" r="0.9" fill="#07C160"/>
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="22" height="22" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.1 4.1-3.9 5.6l6.2 5.2C41.6 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
    </svg>
  );
}

function AppleGlyph() {
  return (
    <svg width="20" height="22" viewBox="0 0 24 24" fill="#fff">
      <path d="M16.5 1.5c0 1.1-.45 2.18-1.18 2.96-.78.83-2.05 1.47-3.1 1.39-.13-1.06.4-2.18 1.07-2.92.76-.83 2.07-1.45 3.21-1.43ZM20 17.27c-.55 1.27-.81 1.84-1.52 2.97-.99 1.57-2.39 3.53-4.12 3.55-1.54.01-1.94-1.01-4.04-1-2.1.01-2.54 1.02-4.08 1-1.73-.02-3.06-1.78-4.05-3.36-2.78-4.4-3.07-9.55-1.36-12.3.6-.96 1.46-1.78 2.46-2.36 1.1-.65 2.42-.96 3.7-.92 1.51.05 2.46 1.07 3.71 1.07 1.21 0 1.95-1.07 3.7-1.07 1.32-.01 2.71.42 3.69 1.16-3.24 1.78-2.71 6.41.91 7.26Z"/>
    </svg>
  );
}

function LogoMark() {
  // Mirrors assets/logo-mark.svg (64×64 → rendered at 56)
  return (
    <View style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" viewBox="0 0 64 64" fill="none">
        <rect width="64" height="64" rx="14" fill="#2456E5"/>
        <circle cx="32" cy="32" r="22" fill="#FF8C00" opacity="0.18"/>
        <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
          <path d="M32 18 L32 8"/>
          <path d="M39 19.88 L44 11.22"/>
          <path d="M44.12 25 L52.78 20"/>
          <path d="M46 32 L56 32"/>
          <path d="M44.12 39 L52.78 44"/>
          <path d="M39 44.12 L44 52.78"/>
          <path d="M32 46 L32 56"/>
          <path d="M25 44.12 L20 52.78"/>
          <path d="M19.88 39 L11.22 44"/>
          <path d="M18 32 L8 32"/>
          <path d="M19.88 25 L11.22 20"/>
          <path d="M25 19.88 L20 11.22"/>
        </g>
        <circle cx="32" cy="32" r="9.5" fill="#FF8C00"/>
        <circle cx="29.5" cy="29.5" r="2.5" fill="#FFFFFF" opacity="0.3"/>
      </svg>
    </View>
  );
}

function TopBar({ onClose }) {
  return (
    <View className="flex-row items-center px-1" style={{ height: 44 }}>
      <Pressable onPress={onClose}>
        <Text className="text-2xl text-ink leading-none">×</Text>
      </Pressable>
    </View>
  );
}

function SuccessOverlay() {
  return (
    <View className="flex-1 bg-surface px-lg pb-lg relative">
      <TopBar/>
      <View className="flex-1 items-center justify-center gap-4 pb-20">
        <SuccessCheck/>
        <Text className="text-xl font-semibold text-ink mt-2">登录成功</Text>
        <View className="flex-row items-center gap-2">
          <Spinner size={12} tone="muted"/>
          <Text className="text-sm text-ink-muted">正在进入今日时间线…</Text>
        </View>
      </View>
      <View className="absolute rounded-2xl bg-surface-alt p-3.5 opacity-60" style={{ left: 16, right: 16, bottom: 8, height: 96 }}>
        <View className="rounded-sm bg-line mb-2.5" style={{ height: 10, width: "33%" }}/>
        <View className="rounded-sm bg-line mb-2.5" style={{ height: 10, width: "70%" }}/>
        <View className="rounded-sm bg-line" style={{ height: 10, width: "55%" }}/>
      </View>
    </View>
  );
}

function LoginScreen({
  state = "idle", errorScope = "sms",
  onSendCode, onSubmit, onWeChat, onGoogle, onApple, onHelp, onClose,
  platform = "ios",
}) {
  const [phone, setPhone] = React.useState("138 0013 8000");
  const [sms, setSms] = React.useState(
    state === "error" && errorScope === "submit" ? "381042"
    : state === "submitting" ? "284917"
    : ""
  );

  const requesting = state === "requesting_sms";
  const submitting = state === "submitting";
  const ticking = state === "sms_sent" || state === "submitting"
    || (state === "error" && errorScope === "submit");
  const remaining = useCountdown(60, ticking);

  const errorText =
    state !== "error" ? null
    : errorScope === "sms" ? "获取验证码失败，请稍后重试"
    : "验证码不正确，请重新输入";

  if (state === "success") return <SuccessOverlay/>;

  const canSubmit =
    (state === "sms_sent" || state === "submitting"
     || (state === "error" && errorScope === "submit"))
    && sms.replace(/\s/g, "").length >= 6;
  const ctaDisabled = !canSubmit && !submitting;

  return (
    <View className="flex-1 bg-surface px-lg pb-lg">
      <TopBar onClose={onClose}/>

      {/* Header */}
      <View className="mt-3 items-center gap-2">
        <LogoMark/>
        <Text className="text-3xl font-bold text-ink mt-3.5 tracking-tight text-center" style={{ fontSize: 28 }}>欢迎回来</Text>
        <Text className="text-sm text-ink-muted text-center">把这一段日子，过得不虚此生。</Text>
      </View>

      {/* Form */}
      <View className="mt-9 gap-3">
        <PhoneInput value={phone} onChangeText={setPhone} disabled={requesting || submitting}
                    errored={state === "error" && errorScope === "sms"}/>
        <SmsInput
          value={sms} onChangeText={setSms}
          requesting={requesting}
          ticking={ticking && remaining > 0}
          countdown={remaining}
          onSend={onSendCode}
          disabled={submitting}
          errored={state === "error" && errorScope === "submit"}
        />
        {errorText ? <ErrorRow text={errorText}/> : null}
      </View>

      {/* CTA */}
      <View className="mt-7">
        <PrimaryButton
          label={submitting ? "登录中…" : "登录 / 注册"}
          loading={submitting}
          disabled={ctaDisabled}
          onPress={onSubmit}
        />
      </View>

      <View className="flex-1"/>

      {/* OAuth */}
      <View className="mt-6 flex-row items-center gap-3">
        <View className="flex-1 bg-line-soft" style={{ height: 1 }}/>
        <Text className="text-[11px] text-ink-subtle">其他登录方式</Text>
        <View className="flex-1 bg-line-soft" style={{ height: 1 }}/>
      </View>

      <View className="mt-4 flex-row justify-center gap-10">
        <OAuthCircle bg="bg-[#07C160]" label="微信" onPress={onWeChat}>
          <WeChatGlyph/>
        </OAuthCircle>
        <OAuthCircle bg="bg-surface border border-line" label="Google" onPress={onGoogle}>
          <GoogleGlyph/>
        </OAuthCircle>
        {platform !== "android" ? (
          <OAuthCircle bg="bg-ink" label="Apple" onPress={onApple}>
            <AppleGlyph/>
          </OAuthCircle>
        ) : null}
      </View>

      {/* Help link */}
      <View className="items-center mt-5">
        <Pressable onPress={onHelp}>
          <Text className="text-xs text-ink-muted">登录遇到问题</Text>
        </Pressable>
      </View>

      {/* Implicit agreement */}
      <Text className="text-center text-[11px] text-ink-subtle mt-3">
        登录即表示同意 <Text className="text-brand-500">《服务条款》</Text>
        <Text className="text-brand-500">《隐私政策》</Text>
      </Text>
    </View>
  );
}

window.LoginScreen = LoginScreen;
