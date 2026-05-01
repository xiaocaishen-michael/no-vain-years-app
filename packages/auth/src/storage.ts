// Platform-aware persistent storage for Zustand persist middleware.
//
// Native (iOS / Android): expo-secure-store → iOS Keychain / Android Keystore.
// Web: localStorage (M1.2 测试期). M3 前升级 HttpOnly cookie per CLAUDE.md
// § 一 Storage 安全纪律.
//
// Conforms to Zustand's StateStorage interface (getItem / setItem / removeItem).

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { StateStorage } from 'zustand/middleware';

const isWeb = Platform.OS === 'web';

export const sessionStorage: StateStorage = {
  getItem: async (key) => {
    if (isWeb) {
      return typeof window === 'undefined' ? null : window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (isWeb) {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (isWeb) {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
