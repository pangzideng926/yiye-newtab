import { describe, expect, it } from 'vitest';
import {
  findTileLocation,
  mergeAppsIntoFolder,
  moveAppIntoFolder,
  moveOutOfFolder,
  moveTileToGroup,
  removeTile,
  reorderInGroup,
} from './boardOps';
import { createAppTile, createDefaultState, createFolderTile } from './defaults';
import type { AppState, FolderTile } from '../types';

function makeTestState(): AppState {
  const base = createDefaultState();
  base.groups = [
    {
      id: 'g1',
      name: '分组一',
      icon: 'bag',
      items: [
        createAppTile('GitHub', 'https://github.com', '#24292f', 'github', 'a1'),
        createAppTile('Google', 'https://www.google.com', '#4285f4', null, 'a2'),
        createFolderTile(
          '工具',
          [createAppTile('MDN', 'https://developer.mozilla.org', '#0c2b3c', null, 'c1')],
          'f1',
        ),
      ],
    },
    {
      id: 'g2',
      name: '分组二',
      icon: 'home',
      items: [],
    },
  ];
  base.group = 'g1';
  return base;
}

describe('网格与文件夹操作 boardOps', () => {
  it('能同组排序并合并两个图标为文件夹', () => {
    const s0 = makeTestState();
    const reordered = reorderInGroup(s0, 'g1', 'a1', 'a2', true).state;
    expect(reordered.groups[0].items.map((x) => x.id)).toEqual(['a2', 'a1', 'f1']);

    const merged = mergeAppsIntoFolder(s0, 'a1', 'a2').state;
    expect(merged.groups[0].items).toHaveLength(2);
    const createdFolder = merged.groups[0].items[0] as FolderTile;
    expect(createdFolder.type).toBe('folder');
    expect(createdFolder.children.map((c) => c.id)).toEqual(['a2', 'a1']);
  });

  it('能拖入、移出文件夹并在空文件夹时自动清理', () => {
    const s0 = makeTestState();
    const movedIn = moveAppIntoFolder(s0, 'a1', 'f1').state;
    const f1 = findTileLocation(movedIn, 'f1')?.item as FolderTile;
    expect(f1.children.map((c) => c.id)).toEqual(['c1', 'a1']);

    const movedOut = moveOutOfFolder(movedIn, 'a1').state;
    expect(movedOut.groups[0].items.some((x) => x.id === 'a1')).toBe(true);

    // 移走最后一个子项 c1 时应自动移除空文件夹 f1
    const afterEmpty = removeTile(movedOut, 'c1').state;
    expect(afterEmpty.groups[0].items.some((x) => x.id === 'f1')).toBe(false);
  });

  it('能跨分组移动图标', () => {
    const s0 = makeTestState();
    const moved = moveTileToGroup(s0, 'a1', 'g2').state;
    expect(moved.groups[0].items.some((x) => x.id === 'a1')).toBe(false);
    expect(moved.groups[1].items.some((x) => x.id === 'a1')).toBe(true);
  });
});
