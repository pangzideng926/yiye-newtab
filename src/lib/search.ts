import type { EngineId } from '../types';

export interface SearchEngine {
  id: EngineId;
  name: string;
  url: string;
  short: string;
}

export const SEARCH_ENGINES: SearchEngine[] = [
  { id: 'baidu', name: '百度', short: '百', url: 'https://www.baidu.com/s?wd=' },
  { id: 'google', name: 'Google', short: 'G', url: 'https://www.google.com/search?q=' },
  { id: 'bing', name: 'Bing', short: 'B', url: 'https://www.bing.com/search?q=' },
  { id: 'github', name: 'GitHub', short: 'GH', url: 'https://github.com/search?q=' },
  { id: 'bilibili', name: 'B站', short: 'B站', url: 'https://search.bilibili.com/all?keyword=' },
];

/** 判断输入是否像直接访问的网址（支持协议头、localhost、IPv4 与常见域名） */
export function isLikelyUrl(raw: string): boolean {
  const input = raw.trim();
  if (!input || /\s/.test(input)) return false;

  if (/^https?:\/\/\S+$/i.test(input)) return true;
  if (/^localhost(:\d{1,5})?(\/.*)?$/i.test(input)) return true;
  if (/^(\d{1,3}\.){3}\d{1,3}(:\d{1,5})?(\/.*)?$/.test(input)) {
    const host = input.split(/[/:]/)[0];
    return host.split('.').every((octet) => Number(octet) >= 0 && Number(octet) <= 255);
  }

  // 域名匹配：要求至少有一个二级标签和纯字母 TLD（排除 3.14 这类小数）
  return /^([a-z0-9-]+\.)+[a-z]{2,}(:\d{1,5})?(\/.*)?$/i.test(input);
}

/** 解析搜索输入：网址直接构造打开链接，普通词条拼接当前搜索引擎 URL */
export function resolveSearchTarget(
  raw: string,
  engineId: EngineId,
): { kind: 'url' | 'search'; url: string } | null {
  const q = raw.trim();
  if (!q) return null;

  if (isLikelyUrl(q)) {
    const url = /^https?:\/\//i.test(q) ? q : `https://${q}`;
    return { kind: 'url', url };
  }

  const engine = SEARCH_ENGINES.find((e) => e.id === engineId) ?? SEARCH_ENGINES[0];
  return { kind: 'search', url: `${engine.url}${encodeURIComponent(q)}` };
}
