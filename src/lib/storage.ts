import type { AppState } from '../types';
import { createDefaultState } from './defaults';
import { parseAppState } from './schema';

export const STORAGE_KEY = 'yiyepage.v2';

function hasChromeStorage(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    Boolean(chrome?.storage?.local) &&
    typeof chrome.storage.local.get === 'function' &&
    typeof chrome.storage.local.set === 'function'
  );
}

/** 读取扩展本地存储；非扩展开发预览环境自动回退到 localStorage */
export async function loadAppState(): Promise<AppState> {
  try {
    if (hasChromeStorage()) {
      const result = await chrome.storage.local.get(STORAGE_KEY);
      const raw = result?.[STORAGE_KEY];
      if (raw !== undefined) {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const validated = parseAppState(parsed);
        if (validated.ok) return validated.data;
      }
      return createDefaultState();
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultState();
      const validated = parseAppState(JSON.parse(raw));
      if (validated.ok) return validated.data;
    }
  } catch {
    // 损坏数据静默回退到默认布局
  }
  return createDefaultState();
}

/** 保存完整状态到扩展存储或 localStorage */
export async function saveAppState(state: AppState): Promise<void> {
  try {
    if (hasChromeStorage()) {
      await chrome.storage.local.set({ [STORAGE_KEY]: state });
      return;
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // 存储配额满或隐私模式禁止写入时忽略异常，避免界面崩溃
  }
}
