import { useCallback, useEffect, useState } from 'react';
import {
  fetchHomedashData,
  HOMEDASH_REFRESH_MS,
  type HomedashKind,
  type HomedashResult,
} from '../lib/homedash';

/**
 * 集中订阅 homedash 接口的 Hook：
 * - 未配置地址时不发出任何请求，直接返回 unconfigured 状态；
 * - 已配置时默认每 5 分钟刷新一次，不进行高频轮询。
 */
export function useHomedash<K extends HomedashKind>(
  kind: K,
  baseUrl: string,
  token: string,
): { result: HomedashResult<K>; loading: boolean; refresh: () => void } {
  const trimmedUrl = baseUrl.trim();
  const [result, setResult] = useState<HomedashResult<K>>({ status: 'unconfigured' });
  const [loading, setLoading] = useState(false);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => {
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!trimmedUrl) {
      setResult({ status: 'unconfigured' });
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let active = true;

    const load = async () => {
      setLoading(true);
      const next = await fetchHomedashData(kind, {
        baseUrl: trimmedUrl,
        token,
        signal: controller.signal,
      });
      if (active && !controller.signal.aborted) {
        setResult(next);
        setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load();
    }, HOMEDASH_REFRESH_MS);

    return () => {
      active = false;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [kind, trimmedUrl, token, nonce]);

  return { result, loading, refresh };
}
