import type {
  AppState,
  AppTile,
  FolderTile,
  Group,
  IconKind,
  TileItem,
  WidgetData,
  WidgetKind,
} from '../types';
import { createAppTile, createDefaultGroups, createFolderTile, createWidgetTile } from './defaults';
import { normalizeUrl, uid } from './url';

export interface TileLocation {
  groupIndex: number;
  group: Group;
  itemIndex: number;
  item: TileItem;
  folderIndex?: number;
  folder?: FolderTile;
}

export interface OpResult {
  state: AppState;
  toast?: string;
}

function cloneState(state: AppState): AppState {
  return structuredClone(state);
}

export function findTileLocation(state: AppState, tileId: string): TileLocation | null {
  for (let gi = 0; gi < state.groups.length; gi += 1) {
    const group = state.groups[gi];
    for (let ii = 0; ii < group.items.length; ii += 1) {
      const item = group.items[ii];
      if (item.id === tileId) {
        return { groupIndex: gi, group, itemIndex: ii, item };
      }
      if (item.type === 'folder') {
        for (let fi = 0; fi < item.children.length; fi += 1) {
          const child = item.children[fi];
          if (child.id === tileId) {
            return {
              groupIndex: gi,
              group,
              itemIndex: fi,
              item: child,
              folderIndex: ii,
              folder: item,
            };
          }
        }
      }
    }
  }
  return null;
}

function pruneEmptyFolder(group: Group, folderId?: string) {
  if (!folderId) return;
  const idx = group.items.findIndex((it) => it.id === folderId && it.type === 'folder');
  if (idx >= 0) {
    const folder = group.items[idx] as FolderTile;
    if (folder.children.length === 0) {
      group.items.splice(idx, 1);
    }
  }
}

function removeFromLocation(next: AppState, loc: TileLocation): TileItem {
  const group = next.groups[loc.groupIndex];
  if (loc.folder && loc.folderIndex !== undefined) {
    const folder = group.items[loc.folderIndex] as FolderTile;
    const [removed] = folder.children.splice(loc.itemIndex, 1);
    pruneEmptyFolder(group, folder.id);
    return removed;
  }
  const [removed] = group.items.splice(loc.itemIndex, 1);
  return removed;
}

export interface AppTilePayload {
  name: string;
  url: string;
  color: string;
  icon?: IconKind | null;
  iconUrl?: string;
}

export function addAppTile(
  state: AppState,
  payload: AppTilePayload,
  groupId: string,
  folderId?: string,
): OpResult {
  const next = cloneState(state);
  const group = next.groups.find((g) => g.id === groupId) ?? next.groups[0];
  const tile = createAppTile(
    payload.name.trim(),
    normalizeUrl(payload.url),
    payload.color,
    payload.icon ?? null,
  );
  if (payload.iconUrl?.trim()) {
    tile.iconUrl = payload.iconUrl.trim();
  }

  if (folderId) {
    const folder = group.items.find((it) => it.id === folderId && it.type === 'folder') as
      FolderTile | undefined;
    if (folder) {
      folder.children.push(tile);
      return { state: next, toast: `已添加到「${folder.name}」` };
    }
  }
  group.items.push(tile);
  return { state: next, toast: '已添加网址' };
}

export function updateAppTile(
  state: AppState,
  tileId: string,
  payload: AppTilePayload,
  destGroupId: string,
  destFolderId?: string,
): OpResult {
  const next = cloneState(state);
  const loc = findTileLocation(next, tileId);
  if (!loc || loc.item.type !== 'app') return { state };

  const targetItem = loc.item as AppTile;
  targetItem.name = payload.name.trim();
  targetItem.url = normalizeUrl(payload.url);
  targetItem.color = payload.color;
  if (payload.iconUrl?.trim()) {
    targetItem.iconUrl = payload.iconUrl.trim();
    targetItem.icon = null;
  } else {
    delete targetItem.iconUrl;
  }

  const sameFolder = (loc.folder?.id ?? '') === (destFolderId ?? '');
  const sameGroup = loc.group.id === destGroupId;
  if (!sameGroup || !sameFolder) {
    const removed = removeFromLocation(next, loc) as AppTile;
    const destGroup = next.groups.find((g) => g.id === destGroupId) ?? next.groups[0];
    if (destFolderId) {
      const folder = destGroup.items.find(
        (it) => it.id === destFolderId && it.type === 'folder',
      ) as FolderTile | undefined;
      if (folder) {
        folder.children.push(removed);
        return { state: next, toast: '已保存并移动' };
      }
    }
    destGroup.items.push(removed);
  }

  return { state: next, toast: '已保存' };
}

export function addFolderTile(state: AppState, groupId: string, name: string): OpResult {
  const next = cloneState(state);
  const group = next.groups.find((g) => g.id === groupId) ?? next.groups[0];
  group.items.push(createFolderTile(name.trim(), []));
  return { state: next, toast: '已新建文件夹' };
}

export function renameFolderTile(state: AppState, folderId: string, name: string): OpResult {
  const next = cloneState(state);
  const loc = findTileLocation(next, folderId);
  if (!loc || loc.item.type !== 'folder') return { state };
  loc.item.name = name.trim();
  return { state: next, toast: '已重命名文件夹' };
}

export function addWidgetTile(state: AppState, groupId: string, kind: WidgetKind): OpResult {
  const next = cloneState(state);
  const group = next.groups.find((g) => g.id === groupId) ?? next.groups[0];
  group.items.push(createWidgetTile(kind));
  return { state: next, toast: '已添加小组件' };
}

export function updateWidgetData(
  state: AppState,
  widgetId: string,
  updater: (prev: WidgetData) => WidgetData,
): AppState {
  const next = cloneState(state);
  const loc = findTileLocation(next, widgetId);
  if (!loc || loc.item.type !== 'widget') return state;
  loc.item.data = updater(loc.item.data ?? {});
  return next;
}

export function removeTile(state: AppState, tileId: string): OpResult {
  const next = cloneState(state);
  const loc = findTileLocation(next, tileId);
  if (!loc) return { state };
  removeFromLocation(next, loc);
  return { state: next, toast: '已删除' };
}

export function reorderInGroup(
  state: AppState,
  groupId: string,
  srcId: string,
  targetId: string,
  after: boolean,
): OpResult {
  if (srcId === targetId) return { state };
  const next = cloneState(state);
  const srcLoc = findTileLocation(next, srcId);
  const targetGroup = next.groups.find((g) => g.id === groupId);
  if (!srcLoc || !targetGroup) return { state };

  // 若从文件夹内直接拖到主板，先移出到目标分组再插入目标位置
  const movedItem = removeFromLocation(next, srcLoc);
  let targetIdx = targetGroup.items.findIndex((it) => it.id === targetId);
  if (targetIdx < 0) {
    targetGroup.items.push(movedItem);
    return { state: next };
  }
  if (after) targetIdx += 1;
  targetGroup.items.splice(targetIdx, 0, movedItem);
  return { state: next };
}

export function mergeAppsIntoFolder(state: AppState, srcId: string, targetId: string): OpResult {
  if (srcId === targetId) return { state };
  const next = cloneState(state);
  const srcLoc = findTileLocation(next, srcId);
  const dstLoc = findTileLocation(next, targetId);
  if (!srcLoc || !dstLoc || srcLoc.item.type !== 'app') return { state };

  if (dstLoc.item.type === 'folder') {
    const moved = removeFromLocation(next, srcLoc) as AppTile;
    const refreshedDst = findTileLocation(next, targetId);
    if (!refreshedDst || refreshedDst.item.type !== 'folder') return { state };
    refreshedDst.item.children.push(moved);
    return { state: next, toast: `已放入「${refreshedDst.item.name}」` };
  }

  if (dstLoc.item.type === 'app' && !dstLoc.folder) {
    const moved = removeFromLocation(next, srcLoc) as AppTile;
    const refreshedDst = findTileLocation(next, targetId);
    if (!refreshedDst || refreshedDst.item.type !== 'app') return { state };
    const dstGroup = next.groups[refreshedDst.groupIndex];
    const targetApp = refreshedDst.item;
    const folder = createFolderTile('文件夹', [targetApp, moved]);
    dstGroup.items.splice(refreshedDst.itemIndex, 1, folder);
    return { state: next, toast: '已合成文件夹' };
  }

  return { state };
}

export function moveAppIntoFolder(state: AppState, srcId: string, folderId: string): OpResult {
  const next = cloneState(state);
  const srcLoc = findTileLocation(next, srcId);
  if (!srcLoc || srcLoc.item.type !== 'app') return { state };
  if (srcLoc.folder?.id === folderId) return { state };

  const moved = removeFromLocation(next, srcLoc) as AppTile;
  const folderLoc = findTileLocation(next, folderId);
  if (!folderLoc || folderLoc.item.type !== 'folder') return { state };
  folderLoc.item.children.push(moved);
  return { state: next, toast: `已放入「${folderLoc.item.name}」` };
}

export function moveOutOfFolder(state: AppState, itemId: string): OpResult {
  const next = cloneState(state);
  const loc = findTileLocation(next, itemId);
  if (!loc || !loc.folder) return { state };
  const removed = removeFromLocation(next, loc);
  next.groups[loc.groupIndex].items.push(removed);
  return { state: next, toast: '已移出文件夹' };
}

export function reorderInFolder(
  state: AppState,
  folderId: string,
  srcId: string,
  targetId: string,
): OpResult {
  if (srcId === targetId) return { state };
  const next = cloneState(state);
  const folderLoc = findTileLocation(next, folderId);
  if (!folderLoc || folderLoc.item.type !== 'folder') return { state };

  const list = folderLoc.item.children;
  const fromIdx = list.findIndex((it) => it.id === srcId);
  const toIdx = list.findIndex((it) => it.id === targetId);
  if (fromIdx < 0 || toIdx < 0) return { state };

  const [moved] = list.splice(fromIdx, 1);
  list.splice(toIdx, 0, moved);
  return { state: next };
}

export function moveTileToGroup(state: AppState, itemId: string, targetGroupId: string): OpResult {
  const next = cloneState(state);
  const loc = findTileLocation(next, itemId);
  const targetGroup = next.groups.find((g) => g.id === targetGroupId);
  if (!loc || !targetGroup) return { state };
  if (loc.group.id === targetGroupId && !loc.folder) return { state };

  const moved = removeFromLocation(next, loc);
  targetGroup.items.push(moved);
  return { state: next, toast: `已移到「${targetGroup.name}」` };
}

export function addGroup(state: AppState, name: string): OpResult {
  const next = cloneState(state);
  const id = `g_${uid()}`;
  next.groups.push({ id, name: name.trim(), icon: 'bag', items: [] });
  next.group = id;
  return { state: next, toast: '已新建分组，右键空白处可添加图标' };
}

export function renameGroup(state: AppState, groupId: string, name: string): OpResult {
  const next = cloneState(state);
  const g = next.groups.find((x) => x.id === groupId);
  if (!g) return { state };
  g.name = name.trim();
  return { state: next, toast: '已重命名分组' };
}

export function deleteGroup(state: AppState, groupId: string): OpResult {
  if (state.groups.length <= 1) {
    return { state, toast: '至少保留一个分组' };
  }
  const next = cloneState(state);
  const idx = next.groups.findIndex((x) => x.id === groupId);
  if (idx < 0) return { state };
  next.groups.splice(idx, 1);
  if (next.group === groupId) {
    next.group = next.groups[Math.max(0, idx - 1)].id;
  }
  return { state: next, toast: '已删除分组' };
}

export function resetGroupToDefault(state: AppState, groupId: string): OpResult {
  const next = cloneState(state);
  const group = next.groups.find((g) => g.id === groupId);
  if (!group) return { state };
  const def = createDefaultGroups().find((g) => g.id === groupId);
  group.items = def ? def.items : [];
  return { state: next, toast: '已重置当前分组' };
}
