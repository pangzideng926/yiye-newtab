import { useEffect, useState } from 'react';
import { findWallpaperPreset } from '../lib/wallpapers';

interface WallpaperProps {
  wallpaperId: string;
  customUrl: string;
}

/**
 * 全屏壁纸层：
 * - 底层始终渲染内置 CSS 渐变预设；
 * - 若用户选择了自定义图片 URL，尝试加载并在成功时淡入显示，失败自动回退到渐变。
 */
export function Wallpaper({ wallpaperId, customUrl }: WallpaperProps) {
  const preset = findWallpaperPreset(wallpaperId);
  const activeUrl = wallpaperId === 'custom' ? customUrl.trim() : '';
  const [loadedUrl, setLoadedUrl] = useState<string>('');

  useEffect(() => {
    if (!activeUrl) {
      setLoadedUrl('');
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setLoadedUrl(activeUrl);
    };
    img.onerror = () => {
      if (!cancelled) setLoadedUrl('');
    };
    img.src = activeUrl;

    return () => {
      cancelled = true;
    };
  }, [activeUrl]);

  const showCustom = Boolean(activeUrl && loadedUrl === activeUrl);

  return (
    <>
      <div className="wall-grad" style={{ background: preset.gradient }} />
      <div
        className={`wall-img ${showCustom ? 'loaded' : ''}`}
        style={showCustom ? { backgroundImage: `url("${loadedUrl}")` } : undefined}
      />
      <div className="wall-mask" />
    </>
  );
}
