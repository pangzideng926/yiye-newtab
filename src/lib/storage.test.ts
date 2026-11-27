import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultState } from './defaults';
import { validateImportJson } from './schema';
import { loadAppState, saveAppState, STORAGE_KEY } from './storage';

describe('存储读写与 JSON 导入导出校验', () => {
  const originalChrome = globalThis.chrome;

  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    if (originalChrome === undefined) {
      Reflect.deleteProperty(globalThis, 'chrome');
    } else {
      globalThis.chrome = originalChrome;
    }
    vi.restoreAllMocks();
  });

  it('无 chrome.storage 时自动回退到 localStorage', async () => {
    Reflect.deleteProperty(globalThis, 'chrome');
    const custom = createDefaultState();
    custom.engine = 'github';
    custom.settings.cols = 7;

    await saveAppState(custom);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeTruthy();

    const loaded = await loadAppState();
    expect(loaded.engine).toBe('github');
    expect(loaded.settings.cols).toBe(7);
  });

  it('localStorage 存在损坏 JSON 或无效结构时安全回退默认布局', async () => {
    Reflect.deleteProperty(globalThis, 'chrome');
    window.localStorage.setItem(STORAGE_KEY, '{broken-json');
    const fromBroken = await loadAppState();
    expect(fromBroken.groups.length).toBe(3);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, groups: [] }));
    const fromBadVersion = await loadAppState();
    expect(fromBadVersion.version).toBe(2);
    expect(fromBadVersion.groups.length).toBe(3);
  });

  it('在扩展环境下优先使用 chrome.storage.local', async () => {
    const store: Record<string, unknown> = {};
    const getMock = vi.fn(async (key: string) => ({ [key]: store[key] }));
    const setMock = vi.fn(async (obj: Record<string, unknown>) => {
      Object.assign(store, obj);
    });

    globalThis.chrome = {
      storage: {
        local: {
          get: getMock,
          set: setMock,
        },
      },
    } as unknown as typeof chrome;

    const custom = createDefaultState();
    custom.settings.weatherCity = '上海';
    await saveAppState(custom);
    expect(setMock).toHaveBeenCalledTimes(1);

    const loaded = await loadAppState();
    expect(getMock).toHaveBeenCalledWith(STORAGE_KEY);
    expect(loaded.settings.weatherCity).toBe('上海');
  });

  it('导入校验能通过合法 JSON 并拒绝非法或危险数据', () => {
    const valid = createDefaultState();
    valid.settings.cols = 8;
    const okRes = validateImportJson(JSON.stringify(valid));
    expect(okRes.ok).toBe(true);
    if (okRes.ok) {
      expect(okRes.data.settings.cols).toBe(8);
    }

    expect(validateImportJson('not json').ok).toBe(false);
    expect(validateImportJson(JSON.stringify({ version: 99, groups: [] })).ok).toBe(false);
    expect(validateImportJson(JSON.stringify({ version: 2, groups: [] })).ok).toBe(false);

    // 拒绝 javascript: 协议的恶意快捷方式
    const malicious = createDefaultState();
    malicious.groups[0].items.push({
      id: 'bad1',
      type: 'app',
      name: 'XSS',
      url: 'javascript:alert(1)',
      color: '#000',
      w: 1,
      h: 1,
    });
    expect(validateImportJson(JSON.stringify(malicious)).ok).toBe(false);
  });
});
