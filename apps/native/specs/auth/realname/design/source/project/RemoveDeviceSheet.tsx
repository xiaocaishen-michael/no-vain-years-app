// RemoveDeviceSheet.tsx
// 「移除设备」bottom sheet (覆盖在 detail page 之上)
//
// Library 决议: RN 内置 Modal + bottom-aligned 自定义视觉 + 顶部拖拽 handle
//   理由: zero 新依赖; 单步确认场景手势/spring 不必要;
//         视觉 mirror @gorhom/bottom-sheet (顶部 handle bar) 让用户感觉熟悉.
//
// 视觉:
//   • overlay      = modal-overlay (rgba(15,18,28,0.48), 复用 delete-cancel)
//   • card         = surface 白底, rounded-t-lg (仅顶部 16px 圆角), shadow-sheet
//   • handle       = bg-line-strong 4×40 pill, 居中 mt-sm
//   • ✕ 关闭       = card 右上 inline icon; tap 等价「取消」
//   • 标题         = ink 大字 semibold 居中
//   • 描述         = ink-muted 居中, leading-relaxed
//   • 双 button    = 50/50, gap-sm, 取消 outline / 移除 err fill
//
// 状态:
//   sheet-default     默认弹出
//   sheet-submitting  移除按钮 busy (spinner + "移除中..."), 取消 disabled
//   sheet-error       顶部 ErrorRow + 按钮回归默认

import React from 'react';
import { View, Text, Pressable, ActivityIndicator, Modal } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type SheetState = 'default' | 'submitting' | 'error';

export interface RemoveDeviceSheetProps {
  visible?: boolean;
  state?: SheetState;
  errorMessage?: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  /** preview only — 强制渲染 (绕过 Modal portal) */
  inline?: boolean;
}

const stroke = (c: string, w = 2) => ({
  stroke: c,
  strokeWidth: w,
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

function IconClose({ color = '#666666' }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M6 6 L18 18 M18 6 L6 18" {...stroke(color, 2)} />
    </Svg>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <View className="bg-err-soft rounded-xs px-sm py-sm flex-row items-center gap-2">
      <View
        className="rounded-full bg-err items-center justify-center"
        style={{ width: 16, height: 16 }}
      >
        <Text className="text-[10px] font-bold text-surface">!</Text>
      </View>
      <Text className="text-xs text-err flex-1">{message}</Text>
    </View>
  );
}

// ─── Sheet body ──────────────────────────────────────────────────────────
function SheetBody({
  state = 'default',
  errorMessage = '网络错误，请重试',
  onCancel,
  onConfirm,
}: Pick<RemoveDeviceSheetProps, 'state' | 'errorMessage' | 'onCancel' | 'onConfirm'>) {
  const submitting = state === 'submitting';

  return (
    <View
      className="bg-surface shadow-sheet"
      style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
    >
      {/* drag handle */}
      <View className="items-center pt-sm">
        <View className="rounded-full bg-line-strong" style={{ width: 40, height: 4 }} />
      </View>

      {/* header row: title centered, close top-right */}
      <View className="px-lg pt-md pb-sm flex-row items-center">
        <View style={{ width: 24 }} />
        <View className="flex-1 items-center">
          <Text className="text-base font-semibold text-ink">移除设备</Text>
        </View>
        <Pressable
          onPress={onCancel}
          hitSlop={10}
          disabled={submitting}
          className="items-center justify-center"
          style={{ width: 24, height: 24, opacity: submitting ? 0.4 : 1 }}
        >
          <IconClose />
        </Pressable>
      </View>

      <View className="px-lg pb-lg gap-md">
        {state === 'error' ? <ErrorRow message={errorMessage} /> : null}

        <Text className="text-sm text-ink-muted text-center" style={{ lineHeight: 22 }}>
          移除设备后，该设备再次登录需要重新安全验证
        </Text>

        {/* button row */}
        <View className="flex-row gap-sm pt-xs">
          {/* 取消 — secondary outline */}
          <Pressable
            onPress={onCancel}
            disabled={submitting}
            className="flex-1 bg-surface border border-line-strong rounded-md items-center justify-center"
            style={{ height: 48, opacity: submitting ? 0.5 : 1 }}
          >
            <Text className="text-base font-medium text-ink">取消</Text>
          </Pressable>
          {/* 移除 — destructive primary fill */}
          <Pressable
            onPress={onConfirm}
            disabled={submitting}
            className="flex-1 bg-err rounded-md items-center justify-center shadow-cta-err"
            style={{ height: 48 }}
          >
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color="#fff" />
                <Text className="text-base font-semibold text-surface">移除中…</Text>
              </View>
            ) : (
              <Text className="text-base font-semibold text-surface">移除</Text>
            )}
          </Pressable>
        </View>

        {/* iOS home-indicator gutter */}
        <View style={{ height: 8 }} />
      </View>
    </View>
  );
}

// ─── Outer (Modal portal OR inline preview) ─────────────────────────────
export default function RemoveDeviceSheet({
  visible = true,
  state = 'default',
  errorMessage,
  onCancel,
  onConfirm,
  inline = false,
}: RemoveDeviceSheetProps) {
  const overlay = (
    <View className="flex-1 bg-modal-overlay justify-end">
      {/* tap-outside scrim — submitting 时不可关闭 */}
      <Pressable onPress={state === 'submitting' ? undefined : onCancel} className="flex-1" />
      <SheetBody
        state={state}
        errorMessage={errorMessage}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </View>
  );

  if (inline) {
    if (!visible) return null;
    return <View className="absolute inset-0">{overlay}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      {overlay}
    </Modal>
  );
}
