export interface WallpaperPreset {
  id: string;
  name: string;
  gradient: string;
}

/**
 * 内置纯 CSS 渐变壁纸预设（不内置版权未确认的外部风景图）。
 * 用户如需照片壁纸，可在设置中填写自定义图片 URL（仅保存在本地存储）。
 */
export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'dusk',
    name: '星雪夜',
    gradient: 'radial-gradient(1200px 800px at 50% 0%, #6b4a7a 0%, #1b2744 45%, #0b1220 100%)',
  },
  {
    id: 'twilight',
    name: '暮紫霞',
    gradient:
      'radial-gradient(1100px 760px at 78% 12%, rgba(240, 138, 90, 0.55) 0%, transparent 55%), linear-gradient(180deg, #2a0850 0%, #6d2864 46%, #181022 100%)',
  },
  {
    id: 'aurora',
    name: '极光夜',
    gradient:
      'radial-gradient(1000px 640px at 22% 10%, rgba(74, 222, 168, 0.34) 0%, transparent 55%), radial-gradient(900px 640px at 80% 24%, rgba(96, 165, 250, 0.32) 0%, transparent 55%), linear-gradient(180deg, #09131e 0%, #102438 55%, #070b12 100%)',
  },
  {
    id: 'sunrise',
    name: '云海晨',
    gradient:
      'radial-gradient(1100px 720px at 30% 10%, rgba(247, 198, 158, 0.65) 0%, transparent 56%), linear-gradient(180deg, #5e7496 0%, #3a4a63 52%, #1d2432 100%)',
  },
  {
    id: 'forest',
    name: '山林雾',
    gradient:
      'radial-gradient(1000px 720px at 65% 15%, rgba(167, 210, 188, 0.34) 0%, transparent 56%), linear-gradient(180deg, #2f4d43 0%, #1e332c 54%, #101a17 100%)',
  },
  {
    id: 'ocean',
    name: '蔚蓝海',
    gradient:
      'radial-gradient(950px 700px at 50% 0%, rgba(135, 197, 232, 0.45) 0%, transparent 58%), linear-gradient(180deg, #1b4d70 0%, #123149 52%, #0a1826 100%)',
  },
  {
    id: 'space',
    name: '深空蓝',
    gradient: 'radial-gradient(900px 700px at 70% 10%, #314d7a 0%, #12182a 50%, #07080c 100%)',
  },
  {
    id: 'ink',
    name: '墨韵金',
    gradient:
      'radial-gradient(900px 700px at 20% 0%, rgba(224, 181, 131, 0.35), transparent 52%), linear-gradient(180deg, #1b1813 0%, #12110e 100%)',
  },
];

export function findWallpaperPreset(id: string): WallpaperPreset {
  return WALLPAPER_PRESETS.find((w) => w.id === id) ?? WALLPAPER_PRESETS[0];
}
