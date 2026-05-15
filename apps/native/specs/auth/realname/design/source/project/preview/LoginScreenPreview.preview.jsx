// preview/LoginScreenPreview.preview.jsx — 4 v2 frames side-by-side

const FRAMES = [
  { key: "idle", scope: "sms", num: "01", name: "IDLE", zh: "待输入",
    desc: "进入页面。手机号已记忆，等待用户点「获取验证码」。",
    pillBg: "bg-surface-sunken", pillFg: "text-ink-muted", dot: "bg-ink-muted" },
  { key: "sms_sent", scope: "sms", num: "02", name: "SMS_SENT", zh: "验证码已发",
    desc: "短信已发，60s 倒计时进行中。等待用户输入 6 位码。",
    pillBg: "bg-brand-soft", pillFg: "text-brand-500", dot: "bg-brand-500" },
  { key: "submitting", scope: "sms", num: "03", name: "SUBMITTING", zh: "登录中",
    desc: "码已填，CTA 提交中。后端判 login 还是 auto-create。",
    pillBg: "bg-warn-soft", pillFg: "text-warn", dot: "bg-warn" },
  { key: "error", scope: "submit", num: "04", name: "ERROR", zh: "校验失败",
    desc: "验证码不正确。SMS 框转红，错误信息出现在下方。",
    pillBg: "bg-err-soft", pillFg: "text-err", dot: "bg-err" },
];

function StateFrame({ spec }) {
  return (
    <View className="gap-3" data-screen-label={`${spec.num} ${spec.name}`}>
      <IOSFrame>
        <LoginScreen state={spec.key} errorScope={spec.scope}/>
      </IOSFrame>
      <View className="gap-1" style={{ maxWidth: 360 }}>
        <View className="flex-row items-center gap-2 flex-wrap">
          <View className={`flex-row items-center gap-1.5 px-2 rounded-full ${spec.pillBg}`} style={{ paddingTop: 2, paddingBottom: 2 }}>
            <View className={`rounded-full ${spec.dot}`} style={{ width: 6, height: 6 }}/>
            <Text className={`text-[10px] font-semibold font-mono tracking-wider ${spec.pillFg}`}>{spec.name}</Text>
          </View>
          <Text className="text-[11px] font-medium font-mono text-ink-subtle">{spec.num}</Text>
          <Text className="text-sm font-semibold text-ink">· {spec.zh}</Text>
        </View>
        <Text className="text-xs text-ink-muted leading-snug">{spec.desc}</Text>
      </View>
    </View>
  );
}

function LoginScreenPreview() {
  return (
    <ScrollView className="flex-1 bg-surface-sunken">
      <View className="px-8 py-10 gap-8 items-center">
        <View className="flex-row flex-wrap justify-between items-end gap-6" style={{ width: "100%", maxWidth: 1700 }}>
          <View className="gap-1.5">
            <Text className="text-2xl font-bold text-ink tracking-tight" style={{ fontSize: 26 }}>
              登录页 · Unified Phone-SMS Auth{"  "}
              <Text className="font-medium text-ink-muted" style={{ fontSize: 18 }}>· account-center · v2</Text>
            </Text>
            <Text className="text-sm text-ink-muted leading-relaxed" style={{ maxWidth: 660 }}>
              单 form，无 tab、无注册概念。后端按 phone 自动判 login / 自动创建。三方登录：微信 / Google / Apple（iOS-only）。
              四个状态：待输入 → 验证码已发 → 登录中 → 校验失败。
            </Text>
          </View>
          <View className="flex-row gap-4">
            <Text className="text-[11px] font-mono text-ink-subtle">
              <Text className="text-ink-muted font-medium">Frame</Text>{" "}iPhone · 360×780
            </Text>
            <Text className="text-[11px] font-mono text-ink-subtle">
              <Text className="text-ink-muted font-medium">States</Text>{" "}5 (idle/req/sent/submit/success) +error
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-center gap-7">
          {FRAMES.map(s => <StateFrame key={s.key} spec={s}/>)}
        </View>

        <Text className="text-xs text-ink-muted text-center leading-relaxed" style={{ maxWidth: 760, marginTop: 8 }}>
          源码：<Text className="font-mono text-[11px]">LoginScreen.tsx · IOSFrame.tsx · LoginScreenPreview.tsx</Text>。
          浏览器预览把 RN 原语跑在轻量 Web 影子里。第 5 状态 <Text className="font-mono">success</Text> 与
          <Text className="font-mono"> requesting_sms</Text> 由 caller 触发，未在此横排展示（success 占满整屏）。
        </Text>
      </View>
    </ScrollView>
  );
}

window.LoginScreenPreview = LoginScreenPreview;
