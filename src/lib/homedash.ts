import type { DeviceItem, DownloadItem, VpsItem } from '../types';
import { DEMO_DEVICES, DEMO_DOWNLOADS, DEMO_VPS } from './defaults';
import { isSafeHttpUrl } from './url';

export type HomedashKind = 'devices' | 'vps' | 'downloads';

/** 默认每 5 分钟刷新一次 homedash，避免高频轮询 */
export const HOMEDASH_REFRESH_MS = 5 * 60 * 1000;

export interface HomedashDataMap {
  devices: DeviceItem[];
  vps: VpsItem[];
  downloads: DownloadItem[];
}

export type HomedashResult<K extends HomedashKind> =
  | { status: 'unconfigured' }
  | { status: 'ok'; data: HomedashDataMap[K]; updatedAt: number }
  | { status: 'error'; message: string; fallback: HomedashDataMap[K] };

export interface HomedashClientConfig {
  baseUrl: string;
  token?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

const ENDPOINT_MAP: Record<HomedashKind, string> = {
  devices: '/api/devices',
  vps: '/api/vps',
  downloads: '/api/downloads',
};

function fallbackFor<K extends HomedashKind>(kind: K): HomedashDataMap[K] {
  if (kind === 'devices') return DEMO_DEVICES as HomedashDataMap[K];
  if (kind === 'vps') return DEMO_VPS as HomedashDataMap[K];
  return DEMO_DOWNLOADS as HomedashDataMap[K];
}

/**
 * 集中式 homedash API 客户端。
 *
 * 注意：当前尚未修改 homedash 服务端，扩展直接请求可能受限于：
 * 1. homedash 的 CORS 响应头（Access-Control-Allow-Origin）是否允许扩展源或新标签页；
 * 2. homedash 的令牌/会话鉴权方式（此处预留可选 Bearer token 字段，默认不发送）。
 * 3. Manifest V3 未在 host_permissions 申请用户私有地址，浏览器将依赖服务端 CORS 或后续可选权限授权。
 *
 * 因此，任何网络、CORS、超时或鉴权失败都会返回友好中文提示，并回退到带「示例数据」标记的本地示例。
 */
export async function fetchHomedashData<K extends HomedashKind>(
  kind: K,
  config: HomedashClientConfig,
): Promise<HomedashResult<K>> {
  const base = config.baseUrl.trim().replace(/\/+$/, '');
  if (!base) {
    return { status: 'unconfigured' };
  }
  if (!isSafeHttpUrl(base)) {
    return {
      status: 'error',
      message: 'homedash 地址格式无效，请在设置中检查',
      fallback: fallbackFor(kind),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? 8000);
  const onAbort = () => controller.abort();
  config.signal?.addEventListener('abort', onAbort, { once: true });

  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (config.token?.trim()) {
      headers.Authorization = `Bearer ${config.token.trim()}`;
    }

    const res = await fetch(`${base}${ENDPOINT_MAP[kind]}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (res.status === 401 || res.status === 403) {
      return {
        status: 'error',
        message: 'homedash 鉴权失败（可能需要配置访问令牌或登录会话）',
        fallback: fallbackFor(kind),
      };
    }

    if (!res.ok) {
      return {
        status: 'error',
        message: `homedash 响应异常（状态码 ${res.status}）`,
        fallback: fallbackFor(kind),
      };
    }

    const json = (await res.json()) as unknown;
    const list = Array.isArray(json)
      ? json
      : json && typeof json === 'object' && Array.isArray((json as { items?: unknown }).items)
        ? (json as { items: unknown[] }).items
        : null;

    if (!list) {
      return {
        status: 'error',
        message: 'homedash 返回格式暂不匹配，已回退示例数据',
        fallback: fallbackFor(kind),
      };
    }

    return {
      status: 'ok',
      data: list as HomedashDataMap[K],
      updatedAt: Date.now(),
    };
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return {
      status: 'error',
      message: isAbort
        ? '连接 homedash 超时，已回退示例数据'
        : '无法连接 homedash（可能受网络或 CORS 跨域策略限制），已回退示例数据',
      fallback: fallbackFor(kind),
    };
  } finally {
    clearTimeout(timer);
    config.signal?.removeEventListener('abort', onAbort);
  }
}
