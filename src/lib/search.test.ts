import { describe, expect, it } from 'vitest';
import { isLikelyUrl, resolveSearchTarget } from './search';

describe('搜索与直达网址识别', () => {
  it('能识别常见网址与本机/IP 地址', () => {
    expect(isLikelyUrl('https://github.com')).toBe(true);
    expect(isLikelyUrl('github.com')).toBe(true);
    expect(isLikelyUrl('docs.example.com/guide?tab=1')).toBe(true);
    expect(isLikelyUrl('localhost:3000')).toBe(true);
    expect(isLikelyUrl('192.0.2.10:8080/api')).toBe(true);
  });

  it('普通关键词、小数和空白不会被误判为网址', () => {
    expect(isLikelyUrl('')).toBe(false);
    expect(isLikelyUrl('react hooks 教程')).toBe(false);
    expect(isLikelyUrl('3.14')).toBe(false);
    expect(isLikelyUrl('vite build')).toBe(false);
  });

  it('网址直接打开，关键词走对应搜索引擎', () => {
    expect(resolveSearchTarget('github.com/trending', 'baidu')).toEqual({
      kind: 'url',
      url: 'https://github.com/trending',
    });

    expect(resolveSearchTarget('http://192.0.2.10:3000', 'google')).toEqual({
      kind: 'url',
      url: 'http://192.0.2.10:3000',
    });

    expect(resolveSearchTarget('浏览器扩展', 'baidu')).toEqual({
      kind: 'search',
      url: 'https://www.baidu.com/s?wd=%E6%B5%8F%E8%A7%88%E5%99%A8%E6%89%A9%E5%B1%95',
    });

    expect(resolveSearchTarget('typescript', 'github')).toEqual({
      kind: 'search',
      url: 'https://github.com/search?q=typescript',
    });

    expect(resolveSearchTarget('鬼畜', 'bilibili')).toEqual({
      kind: 'search',
      url: 'https://search.bilibili.com/all?keyword=%E9%AC%BC%E7%95%9C',
    });
  });
});
