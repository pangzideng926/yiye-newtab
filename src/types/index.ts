export type EngineId = 'baidu' | 'google' | 'bing' | 'github' | 'bilibili';

export type WidgetKind =
  'weather' | 'calendar' | 'todos' | 'notes' | 'devices' | 'vps' | 'downloads';

export type IconKind =
  | 'github'
  | 'mail'
  | 'code'
  | 'play'
  | 'cloud'
  | 'home'
  | 'server'
  | 'bolt'
  | 'shop'
  | 'plus'
  | 'bag'
  | 'game'
  | 'book'
  | 'music'
  | 'compass';

export interface AppTile {
  id: string;
  type: 'app';
  name: string;
  url: string;
  color: string;
  icon?: IconKind | null;
  iconUrl?: string;
  w: 1;
  h: 1;
}

export interface FolderTile {
  id: string;
  type: 'folder';
  name: string;
  children: AppTile[];
  w: 1;
  h: 1;
}

export interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

export interface WidgetData {
  items?: TodoItem[];
  content?: string;
}

export interface WidgetTile {
  id: string;
  type: 'widget';
  widget: WidgetKind;
  w: 1 | 2;
  h: 1 | 2;
  data?: WidgetData;
}

export type TileItem = AppTile | FolderTile | WidgetTile;

export interface Group {
  id: string;
  name: string;
  icon: IconKind;
  items: TileItem[];
}

export interface Settings {
  wallpaper: string;
  wallUrl: string;
  icon: number;
  radius: number;
  gap: number;
  cols: number;
  mask: number;
  blur: number;
  clock: boolean;
  date: boolean;
  lunar: boolean;
  search: boolean;
  side: boolean;
  weatherCity: string;
  homedashUrl: string;
  homedashToken: string;
  hideUnconfiguredHomedash: boolean;
}

export interface AppState {
  version: 2;
  group: string;
  engine: EngineId;
  settings: Settings;
  groups: Group[];
}

export interface WeatherDay {
  day: string;
  range: string;
  condition: string;
  code: number;
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  code: number;
  humidity: number;
  wind: string;
  days: WeatherDay[];
  isDemo: boolean;
  error?: string;
}

export interface DeviceItem {
  name: string;
  ip: string;
  online: boolean;
  cpu: number;
  mem: number;
  disk: number;
}

export interface VpsItem {
  place: string;
  vendor: string;
  ip: string;
  quota: string;
  expire: string;
}

export interface DownloadItem {
  name: string;
  progress: number;
  speed: string;
  eta: string;
}
