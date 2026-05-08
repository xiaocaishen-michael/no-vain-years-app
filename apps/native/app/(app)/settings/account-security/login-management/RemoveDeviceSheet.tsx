// 「移除设备」bottom sheet — RN Modal portal, 3 内部状态: default / submitting / error.
//
// 状态由 sheet 自身维护 (不外透):
//   default    → 初始弹出
//   submitting → revokeDevice 飞行中; 取消/关闭 disabled
//   error      → 顶部 ErrorRow + 按钮回归 default; 用户可重试或取消
//
// 成功: invalidate ['devices'] cache → onClose() → router.back()

import { colors } from '@nvy/design-tokens';
import { revokeDevice } from '@nvy/auth';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { deviceErrorCopy, mapDeviceError } from '../../../../../lib/error/device-errors';

// ─── Glyphs ───────────────────────────────────────────────────────────────────

function IconClose({ color = colors.ink.muted }: { color?: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        d="M6 6 L18 18 M18 6 L6 18"
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─── Internal primitives ──────────────────────────────────────────────────────

function ErrorRow({ message }: { message: string }) {
  return (
    <View className="bg-err-soft rounded-xs px-sm py-sm flex-row items-center gap-2">
      <View
        className="rounded-full bg-err items-center justify-center"
        style={{ width: 16, height: 16 }}
      >
        <Text className="font-bold text-surface" style={{ fontSize: 10 }}>
          !
        </Text>
      </View>
      <Text className="text-xs text-err flex-1">{message}</Text>
    </View>
  );
}

// ─── Sheet body ───────────────────────────────────────────────────────────────

interface SheetBodyProps {
  sheetState: 'default' | 'submitting' | 'error';
  errorMessage: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function SheetBody({ sheetState, errorMessage, onCancel, onConfirm }: SheetBodyProps) {
  const submitting = sheetState === 'submitting';

  return (
    <View
      className="bg-surface shadow-sheet"
      style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
    >
      {/* drag handle */}
      <View className="items-center pt-sm">
        <View className="rounded-full bg-line-strong" style={{ width: 40, height: 4 }} />
      </View>

      {/* header: title centered, ✕ close top-right */}
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
        {sheetState === 'error' ? <ErrorRow message={errorMessage} /> : null}

        <Text className="text-sm text-ink-muted text-center" style={{ lineHeight: 22 }}>
          移除设备后，该设备再次登录需要重新安全验证
        </Text>

        {/* buttons: 取消(outline) / 移除(err fill) */}
        <View className="flex-row gap-sm pt-xs">
          <Pressable
            onPress={onCancel}
            disabled={submitting}
            className="flex-1 bg-surface border border-line-strong rounded-md items-center justify-center"
            style={{ height: 48, opacity: submitting ? 0.5 : 1 }}
          >
            <Text className="text-base font-medium text-ink">取消</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            disabled={submitting}
            className="flex-1 bg-err rounded-md items-center justify-center shadow-cta-err"
            style={{ height: 48 }}
          >
            {submitting ? (
              <View className="flex-row items-center gap-2">
                <ActivityIndicator size="small" color={colors.surface.DEFAULT} />
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

// ─── Public component ─────────────────────────────────────────────────────────

interface RemoveDeviceSheetProps {
  visible: boolean;
  recordId: number;
  onClose: () => void;
}

export default function RemoveDeviceSheet({ visible, recordId, onClose }: RemoveDeviceSheetProps) {
  const [sheetState, setSheetState] = useState<'default' | 'submitting' | 'error'>('default');
  const [errorMessage, setErrorMessage] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleConfirm = async () => {
    setSheetState('submitting');
    try {
      await revokeDevice(recordId);
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      onClose();
      router.back();
    } catch (e) {
      setErrorMessage(deviceErrorCopy(mapDeviceError(e)));
      setSheetState('error');
    }
  };

  const handleCancel = () => {
    if (sheetState === 'submitting') return;
    setSheetState('default');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleCancel}>
      <View className="flex-1 bg-modal-overlay justify-end">
        {/* tap-outside scrim — submitting 时不可关闭 */}
        <Pressable
          onPress={sheetState === 'submitting' ? undefined : handleCancel}
          className="flex-1"
        />
        <SheetBody
          sheetState={sheetState}
          errorMessage={errorMessage}
          onCancel={handleCancel}
          onConfirm={() => void handleConfirm()}
        />
      </View>
    </Modal>
  );
}
