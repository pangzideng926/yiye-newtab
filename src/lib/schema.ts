import type {
  AppState,
  AppTile,
  EngineId,
  FolderTile,
  Group,
  IconKind,
  Settings,
  TileItem,
  TodoItem,
  WidgetKind,
  WidgetTile,
} from '../types';
import { createDefaultSettings, createDefaultState } from './defaults';
import { isSafeHttpUrl, isSafeIconUrl, normalizeUrl, uid } from './url';
import { WALLPAPER_PRESETS } from './wallpapers';

const VALID_ENGINES = new Set<EngineId>(['baidu', 'google', 'bing', 'github', 'bilibili']);
const VALID_WIDGETS = new Set<WidgetKind>([
  'weather',
  'calendar',
  'todos',
  'notes',
  'devices',
  'vps',
  'downloads',
]);
const VALID_ICONS = new Set<IconKind>([
  'github',
  'mail',
  'code',
  'play',
  'cloud',
  'home',
  'server',
  'bolt',
  'shop',
  'plus',
  'bag',
  'game',
  'book',
  'music',
  'compass',
]);
const VALID_WALLS = new Set([...WALLPAPER_PRESETS.map((w) => w.id), 'custom']);

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function clampInt(val: unknown, min: number, max: number, fallback: number): number {
  if (typeof val !== 'number' || !Number.isFinite(val)) return fallback;
  return Math.min(max, Math.max(min, Math.round(val)));
}

function asBool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function parseAppTile(raw: unknown): AppTile | null {
  if (!isRecord(raw) || raw.type !== 'app') return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (typeof raw.url !== 'string' || !isSafeHttpUrl(raw.url)) return null;

  const iconUrlRaw = typeof raw.iconUrl === 'string' ? raw.iconUrl.trim() : '';
  if (iconUrlRaw && !isSafeIconUrl(iconUrlRaw)) return null;

  const iconRaw =
    typeof raw.icon === 'string' && VALID_ICONS.has(raw.icon as IconKind)
      ? (raw.icon as IconKind)
      : null;

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : uid(),
    type: 'app',
    name: raw.name.trim(),
    url: normalizeUrl(raw.url),
    color: typeof raw.color === 'string' && raw.color.trim() ? raw.color : '#5b7c99',
    icon: iconRaw,
    ...(iconUrlRaw ? { iconUrl: iconUrlRaw } : {}),
    w: 1,
    h: 1,
  };
}

function parseFolderTile(raw: unknown): FolderTile | null {
  if (!isRecord(raw) || raw.type !== 'folder') return null;
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null;
  if (!Array.isArray(raw.children)) return null;

  const children: AppTile[] = [];
  for (const child of raw.children) {
    const parsed = parseAppTile(child);
    if (!parsed) return null;
    children.push(parsed);
  }

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : uid(),
    type: 'folder',
    name: raw.name.trim(),
    children,
    w: 1,
    h: 1,
  };
}

function parseWidgetTile(raw: unknown): WidgetTile | null {
  if (!isRecord(raw) || raw.type !== 'widget') return null;
  if (typeof raw.widget !== 'string' || !VALID_WIDGETS.has(raw.widget as WidgetKind)) return null;

  const w: 1 | 2 = raw.w === 1 ? 1 : 2;
  const h: 1 | 2 = raw.h === 1 ? 1 : 2;
  const data: WidgetTile['data'] = {};

  if (isRecord(raw.data)) {
    if (Array.isArray(raw.data.items)) {
      const todos: TodoItem[] = [];
      for (const item of raw.data.items) {
        if (isRecord(item) && typeof item.text === 'string' && item.text.trim()) {
          todos.push({
            id: typeof item.id === 'string' && item.id.trim() ? item.id : uid('td'),
            text: item.text.trim(),
            done: Boolean(item.done),
          });
        }
      }
      data.items = todos;
    }
    if (typeof raw.data.content === 'string') {
      data.content = raw.data.content;
    }
  }

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : uid(),
    type: 'widget',
    widget: raw.widget as WidgetKind,
    w,
    h,
    data,
  };
}

function parseTile(raw: unknown): TileItem | null {
  if (!isRecord(raw) || typeof raw.type !== 'string') return null;
  if (raw.type === 'app') return parseAppTile(raw);
  if (raw.type === 'folder') return parseFolderTile(raw);
  if (raw.type === 'widget') return parseWidgetTile(raw);
  return null;
}

function parseSettings(raw: unknown): Settings {
  const def = createDefaultSettings();
  if (!isRecord(raw)) return def;

  const wallUrl =
    typeof raw.wallUrl === 'string' && isSafeIconUrl(raw.wallUrl) ? raw.wallUrl.trim() : '';
  const wallpaper =
    typeof raw.wallpaper === 'string' && VALID_WALLS.has(raw.wallpaper)
      ? raw.wallpaper
      : def.wallpaper;
  const homedashUrlRaw = typeof raw.homedashUrl === 'string' ? raw.homedashUrl.trim() : '';
  const homedashUrl =
    homedashUrlRaw && isSafeHttpUrl(homedashUrlRaw) ? homedashUrlRaw.replace(/\/+$/, '') : '';

  return {
    wallpaper,
    wallUrl,
    icon: clampInt(raw.icon, 52, 96, def.icon),
    radius: clampInt(raw.radius, 8, 32, def.radius),
    gap: clampInt(raw.gap, 10, 40, def.gap),
    cols: clampInt(raw.cols, 4, 8, def.cols),
    mask: clampInt(raw.mask, 0, 70, def.mask),
    blur: clampInt(raw.blur, 0, 16, def.blur),
    clock: asBool(raw.clock, def.clock),
    date: asBool(raw.date, def.date),
    lunar: asBool(raw.lunar, def.lunar),
    search: asBool(raw.search, def.search),
    side: asBool(raw.side, def.side),
    weatherCity:
      typeof raw.weatherCity === 'string' && raw.weatherCity.trim()
        ? raw.weatherCity.trim()
        : def.weatherCity,
    homedashUrl,
    homedashToken: typeof raw.homedashToken === 'string' ? raw.homedashToken.trim() : '',
    hideUnconfiguredHomedash: asBool(raw.hideUnconfiguredHomedash, def.hideUnconfiguredHomedash),
  };
}

export type ParseResult = { ok: true; data: AppState } | { ok: false; error: string };

/** 校验并规范化持久化 / 导入的布局对象 */
export function parseAppState(input: unknown): ParseResult {
  if (!isRecord(input)) {
    return { ok: false, error: '布局数据格式不正确（应为 JSON 对象）' };
  }
  if (input.version !== 2) {
    return { ok: false, error: '不支持的布局版本（仅支持 version: 2）' };
  }
  if (!Array.isArray(input.groups) || input.groups.length === 0) {
    return { ok: false, error: '分组列表不能为空' };
  }

  const groups: Group[] = [];
  for (const rawGroup of input.groups) {
    if (
      !isRecord(rawGroup) ||
      typeof rawGroup.id !== 'string' ||
      !rawGroup.id.trim() ||
      typeof rawGroup.name !== 'string' ||
      !rawGroup.name.trim() ||
      !Array.isArray(rawGroup.items)
    ) {
      return { ok: false, error: '存在格式错误的分组定义' };
    }
    const items: TileItem[] = [];
    for (const rawItem of rawGroup.items) {
      const tile = parseTile(rawItem);
      if (!tile) {
        return { ok: false, error: `分组「${rawGroup.name}」包含无效或不安全的项目` };
      }
      items.push(tile);
    }
    const icon =
      typeof rawGroup.icon === 'string' && VALID_ICONS.has(rawGroup.icon as IconKind)
        ? (rawGroup.icon as IconKind)
        : 'bag';
    groups.push({
      id: rawGroup.id.trim(),
      name: rawGroup.name.trim(),
      icon,
      items,
    });
  }

  const def = createDefaultState();
  const engine =
    typeof input.engine === 'string' && VALID_ENGINES.has(input.engine as EngineId)
      ? (input.engine as EngineId)
      : def.engine;
  const activeGroup =
    typeof input.group === 'string' && groups.some((g) => g.id === input.group)
      ? input.group
      : groups[0].id;

  return {
    ok: true,
    data: {
      version: 2,
      group: activeGroup,
      engine,
      settings: parseSettings(input.settings),
      groups,
    },
  };
}

export function validateImportJson(rawText: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { ok: false, error: 'JSON 解析失败，请检查文件内容' };
  }
  return parseAppState(parsed);
}
