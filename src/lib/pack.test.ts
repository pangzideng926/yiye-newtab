import { describe, expect, it } from 'vitest';
import { createDefaultState, DEMO_DEVICES, DEMO_VPS } from './defaults';
import { packTiles } from './pack';
import type { TileItem } from '../types';

function collectAppUrls(items: TileItem[]): string[] {
  const urls: string[] = [];
  for (const item of items) {
    if (item.type === 'app') urls.push(item.url);
    if (item.type === 'folder') {
      for (const child of item.children) urls.push(child.url);
    }
  }
  return urls;
}

describe('网格装箱与默认数据安全检查', () => {
  it('混排 1x1 图标与 2x2 小组件时互不重叠且不越界', () => {
    const items = [
      { id: 'w1', w: 2, h: 2 },
      { id: 'a1', w: 1, h: 1 },
      { id: 'a2', w: 1, h: 1 },
      { id: 'a3', w: 1, h: 1 },
      { id: 'w2', w: 2, h: 2 },
      { id: 'a4', w: 1, h: 1 },
    ];
    const cols = 4;
    const placed = packTiles(items, cols);
    expect(placed).toHaveLength(items.length);

    const occupied = new Set<string>();
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + p.w).toBeLessThanOrEqual(cols);
      for (let r = p.y; r < p.y + p.h; r += 1) {
        for (let c = p.x; c < p.x + p.w; c += 1) {
          const cell = `${c},${r}`;
          expect(occupied.has(cell)).toBe(false);
          occupied.add(cell);
        }
      }
    }
  });

  it('当列数小于组件宽度时自动夹紧，不会死循环', () => {
    const placed = packTiles([{ id: 'w1', w: 2, h: 2 }], 1);
    expect(placed[0]).toMatchObject({ x: 0, y: 0, w: 1, h: 2 });
  });

  it('默认布局仅含公开站点且不包含真实内网 IP、私人域名或敏感字样', () => {
    const def = createDefaultState();
    expect(def.groups.map((g) => g.name)).toEqual(['工作', '娱乐', '家里']);
    expect(def.settings.homedashUrl).toBe('');
    expect(def.settings.homedashToken).toBe('');

    const serialized = JSON.stringify(def);
    expect(serialized).not.toMatch(/192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[01])\./);
    expect(serialized).not.toContain('刷流');

    const urls = def.groups.flatMap((g) => collectAppUrls(g.items));
    expect(urls.length).toBeGreaterThan(10);
    for (const u of urls) {
      expect(u.startsWith('https://')).toBe(true);
      expect(u).not.toContain('192.0.2.');
    }

    for (const d of DEMO_DEVICES) {
      expect(d.ip.startsWith('192.0.2.')).toBe(true);
    }
    for (const v of DEMO_VPS) {
      expect(v.ip.startsWith('192.0.2.')).toBe(true);
    }
  });
});
