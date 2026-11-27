import type {
  AppState,
  AppTile,
  DeviceItem,
  DownloadItem,
  FolderTile,
  IconKind,
  Settings,
  VpsItem,
  WeatherData,
  WidgetData,
  WidgetKind,
  WidgetTile,
} from '../types';
import { uid } from './url';

export interface WidgetMeta {
  name: string;
  w: 1 | 2;
  h: 1 | 2;
  homedash?: boolean;
  description: string;
}

export const WIDGET_META: Record<WidgetKind, WidgetMeta> = {
  weather: { name: '天气', w: 2, h: 2, description: '默认广州实时天气与五日预报（Open-Meteo）' },
  calendar: { name: '日历', w: 2, h: 2, description: '月历视图与日程标记' },
  todos: { name: '待办', w: 2, h: 2, description: '轻量待办清单，支持增删与勾选' },
  notes: { name: '便签', w: 2, h: 2, description: '随手记录便签，本地自动保存' },
  devices: {
    name: '家用设备',
    w: 2,
    h: 2,
    homedash: true,
    description: '接入 homedash 展示设备状态',
  },
  vps: {
    name: 'VPS 到期',
    w: 2,
    h: 2,
    homedash: true,
    description: '接入 homedash 展示节点到期倒计时',
  },
  downloads: {
    name: '下载进度',
    w: 2,
    h: 2,
    homedash: true,
    description: '接入 homedash 展示下载任务进度',
  },
};

export const DEMO_WEATHER: WeatherData = {
  city: '广州',
  temp: 22,
  condition: '多云',
  code: 2,
  humidity: 68,
  wind: '微风 8 km/h',
  days: [
    { day: '今天', range: '24/16°', condition: '多云', code: 2 },
    { day: '明天', range: '25/17°', condition: '晴', code: 0 },
    { day: '后天', range: '21/15°', condition: '小雨', code: 61 },
    { day: '大后天', range: '23/15°', condition: '多云', code: 2 },
    { day: '第五日', range: '26/18°', condition: '晴', code: 1 },
  ],
  isDemo: true,
};

/** 示例设备数据：仅使用 RFC 5737 文档保留网段 192.0.2.x */
export const DEMO_DEVICES: DeviceItem[] = [
  { name: '办公主机', ip: '192.0.2.10', online: true, cpu: 18, mem: 42, disk: 67 },
  { name: '笔记本电脑', ip: '192.0.2.20', online: true, cpu: 12, mem: 58, disk: 45 },
  { name: '家庭存储 NAS', ip: '192.0.2.30', online: true, cpu: 8, mem: 35, disk: 72 },
];

/** 示例 VPS 到期数据：仅使用 RFC 5737 保留网段 192.0.2.x 与虚构服务商名 */
export const DEMO_VPS: VpsItem[] = [
  {
    place: '香港节点',
    vendor: '示例云 A',
    ip: '192.0.2.101',
    quota: '1000 GB',
    expire: '2026-12-05',
  },
  {
    place: '东京节点',
    vendor: '示例云 B',
    ip: '192.0.2.102',
    quota: '500 GB',
    expire: '2027-01-18',
  },
  {
    place: '美西节点',
    vendor: 'DemoCloud',
    ip: '192.0.2.103',
    quota: '800 GB',
    expire: '2027-06-22',
  },
];

export const DEMO_DOWNLOADS: DownloadItem[] = [
  { name: 'Ubuntu 24.04.2 LTS 镜像', progress: 68, speed: '4.2 MB/s', eta: '剩余 6 分钟' },
  { name: '开源设计资源包', progress: 35, speed: '1.8 MB/s', eta: '剩余 24 分钟' },
  { name: '开发文档离线归档', progress: 100, speed: '已完成', eta: '已就绪' },
];

export const DEMO_CALENDAR_EVENTS = [
  { date: '2026-12-05', text: '示例节点到期提醒' },
  { date: '2026-12-15', text: '月度账单核对' },
];

export function createAppTile(
  name: string,
  url: string,
  color: string,
  icon: IconKind | null = null,
  id = uid(),
): AppTile {
  return { id, type: 'app', name, url, color, icon, w: 1, h: 1 };
}

export function createFolderTile(name: string, children: AppTile[], id = uid()): FolderTile {
  return { id, type: 'folder', name, children, w: 1, h: 1 };
}

export function createWidgetTile(
  widget: WidgetKind,
  w?: 1 | 2,
  h?: 1 | 2,
  data?: WidgetData,
  id = uid(),
): WidgetTile {
  const meta = WIDGET_META[widget];
  return {
    id,
    type: 'widget',
    widget,
    w: w ?? meta.w,
    h: h ?? meta.h,
    data: data ?? (widget === 'todos' ? { items: [] } : widget === 'notes' ? { content: '' } : {}),
  };
}

export function createDefaultSettings(): Settings {
  return {
    wallpaper: 'dusk',
    wallUrl: '',
    icon: 70,
    radius: 18,
    gap: 22,
    cols: 6,
    mask: 32,
    blur: 0,
    clock: true,
    date: true,
    lunar: true,
    search: true,
    side: true,
    weatherCity: '广州',
    homedashUrl: '',
    homedashToken: '',
    hideUnconfiguredHomedash: false,
  };
}

export function createDefaultGroups(): AppState['groups'] {
  return [
    {
      id: 'work',
      name: '工作',
      icon: 'bag',
      items: [
        createWidgetTile('weather', 2, 2),
        createAppTile('GitHub', 'https://github.com', '#24292f', 'github'),
        createAppTile('Google', 'https://www.google.com', '#4285f4', 'compass'),
        createAppTile('Linear', 'https://linear.app', '#5e6ad2', null),
        createAppTile('Gmail', 'https://mail.google.com', '#ea4335', 'mail'),
        createAppTile('MDN', 'https://developer.mozilla.org', '#0c2b3c', 'code'),
        createFolderTile('开发', [
          createAppTile('npm', 'https://www.npmjs.com', '#cb3837', null),
          createAppTile('Stack Overflow', 'https://stackoverflow.com', '#f48024', null),
          createAppTile('Can I Use', 'https://caniuse.com', '#cc3333', null),
          createAppTile('TypeScript', 'https://www.typescriptlang.org', '#3178c6', 'code'),
        ]),
        createWidgetTile('calendar', 2, 2),
        createWidgetTile('devices', 2, 2),
        createWidgetTile('vps', 2, 2),
      ],
    },
    {
      id: 'play',
      name: '娱乐',
      icon: 'game',
      items: [
        createWidgetTile('weather', 2, 2),
        createAppTile('哔哩哔哩', 'https://www.bilibili.com', '#00a1d6', 'play'),
        createAppTile('YouTube', 'https://www.youtube.com', '#ff0000', 'play'),
        createAppTile('网易云音乐', 'https://music.163.com', '#c20c0c', 'music'),
        createAppTile('豆瓣', 'https://www.douban.com', '#007722', 'book'),
        createAppTile('小红书', 'https://www.xiaohongshu.com', '#ff2442', null),
        createAppTile('微博', 'https://weibo.com', '#e6162d', null),
        createAppTile('Steam', 'https://store.steampowered.com', '#1b2838', 'game'),
        createWidgetTile('todos', 2, 2, {
          items: [
            { id: uid('td'), text: '周末看一部想看的电影', done: false },
            { id: uid('td'), text: '整理本周收藏文章', done: false },
          ],
        }),
      ],
    },
    {
      id: 'home',
      name: '家里',
      icon: 'home',
      items: [
        createWidgetTile('devices', 2, 2),
        createWidgetTile('downloads', 2, 2),
        createAppTile('淘宝', 'https://www.taobao.com', '#ff5000', 'shop'),
        createAppTile('京东', 'https://www.jd.com', '#e1251b', 'shop'),
        createAppTile('美团', 'https://www.meituan.com', '#ffc300', 'shop'),
        createAppTile('12306', 'https://www.12306.cn', '#3b82f6', 'bolt'),
        createAppTile('高德地图', 'https://www.amap.com', '#0f8cff', 'compass'),
        createAppTile('百度', 'https://www.baidu.com', '#2932e1', null),
        createWidgetTile('notes', 2, 2, {
          content: '周末采购清单：\n- 牛奶、水果\n- 咖啡豆补货',
        }),
        createWidgetTile('vps', 2, 2),
        createWidgetTile('weather', 2, 2),
      ],
    },
  ];
}

export function createDefaultState(): AppState {
  return {
    version: 2,
    group: 'work',
    engine: 'baidu',
    settings: createDefaultSettings(),
    groups: createDefaultGroups(),
  };
}
