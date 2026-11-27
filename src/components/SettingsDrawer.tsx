import { useRef, type ChangeEvent } from 'react';
import { WALLPAPER_PRESETS } from '../lib/wallpapers';
import type { Settings } from '../types';

interface SettingsDrawerProps {
  open: boolean;
  settings: Settings;
  onClose: () => void;
  onChangeSettings: (patch: Partial<Settings>) => void;
  onExportJson: () => void;
  onImportJsonFile: (file: File) => void;
  onResetCurrentGroup: () => void;
}

export function SettingsDrawer({
  open,
  settings,
  onClose,
  onChangeSettings,
  onExportJson,
  onImportJsonFile,
  onResetCurrentGroup,
}: SettingsDrawerProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onImportJsonFile(f);
    e.target.value = '';
  };

  return (
    <>
      <div className={`dim ${open ? 'on' : ''}`} onClick={onClose} />
      <aside className={`settings ${open ? 'open' : ''}`} aria-label="设置面板">
        <div className="set-hd">
          <div>
            <h2>设置</h2>
            <p className="sub">壁纸、布局与服务配置仅保存在当前浏览器本地存储。</p>
          </div>
          <button type="button" className="icon-x" onClick={onClose} aria-label="关闭设置">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="set-body">
          <div className="blk">
            <h3>壁纸（内置渐变 + 自定义链接）</h3>
            <div className="walls">
              {WALLPAPER_PRESETS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  className={`wall ${settings.wallpaper === w.id ? 'on' : ''}`}
                  style={{ background: w.gradient }}
                  title={w.name}
                  onClick={() => onChangeSettings({ wallpaper: w.id })}
                >
                  <span>{w.name}</span>
                </button>
              ))}
            </div>
            <div className="field" style={{ marginTop: 10 }}>
              <label htmlFor="set-wall-url">自定义图片 URL（加载失败自动回退渐变）</label>
              <input
                id="set-wall-url"
                type="url"
                value={settings.wallUrl}
                onChange={(e) => {
                  const val = e.target.value;
                  onChangeSettings({
                    wallUrl: val,
                    ...(val.trim() ? { wallpaper: 'custom' } : {}),
                  });
                }}
                placeholder="https://example.com/wallpaper.jpg"
              />
            </div>
            <div className="set-row">
              <span>遮罩浓度</span>
              <span>{settings.mask}%</span>
            </div>
            <input
              className="range"
              type="range"
              min={0}
              max={70}
              value={settings.mask}
              onChange={(e) => onChangeSettings({ mask: Number(e.target.value) })}
            />
            <div className="set-row">
              <span>壁纸模糊</span>
              <span>{settings.blur}px</span>
            </div>
            <input
              className="range"
              type="range"
              min={0}
              max={16}
              value={settings.blur}
              onChange={(e) => onChangeSettings({ blur: Number(e.target.value) })}
            />
          </div>

          <div className="blk">
            <h3>图标与网格</h3>
            <div className="set-row">
              <span>图标大小</span>
              <span>{settings.icon}px</span>
            </div>
            <input
              className="range"
              type="range"
              min={52}
              max={96}
              value={settings.icon}
              onChange={(e) => onChangeSettings({ icon: Number(e.target.value) })}
            />
            <div className="set-row">
              <span>图标圆角</span>
              <span>{settings.radius}px</span>
            </div>
            <input
              className="range"
              type="range"
              min={8}
              max={32}
              value={settings.radius}
              onChange={(e) => onChangeSettings({ radius: Number(e.target.value) })}
            />
            <div className="set-row">
              <span>网格间距</span>
              <span>{settings.gap}px</span>
            </div>
            <input
              className="range"
              type="range"
              min={10}
              max={40}
              value={settings.gap}
              onChange={(e) => onChangeSettings({ gap: Number(e.target.value) })}
            />
            <div className="set-row">
              <span>每行列数</span>
              <span>{settings.cols}</span>
            </div>
            <input
              className="range"
              type="range"
              min={4}
              max={8}
              value={settings.cols}
              onChange={(e) => onChangeSettings({ cols: Number(e.target.value) })}
            />
          </div>

          <div className="blk">
            <h3>显示开关</h3>
            {(
              [
                ['clock', '中央大时钟'],
                ['date', '公历日期'],
                ['lunar', '农历日期'],
                ['search', '搜索框'],
                ['side', '左侧分组栏'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="set-row">
                <span>{label}</span>
                <button
                  type="button"
                  className={`toggle ${settings[key] ? 'on' : ''}`}
                  aria-label={label}
                  aria-pressed={settings[key]}
                  onClick={() => onChangeSettings({ [key]: !settings[key] })}
                />
              </div>
            ))}
          </div>

          <div className="blk">
            <h3>天气与 homedash</h3>
            <div className="field">
              <label htmlFor="set-weather-city">天气城市（默认广州，免 Key Open-Meteo）</label>
              <input
                id="set-weather-city"
                type="text"
                value={settings.weatherCity}
                onChange={(e) => onChangeSettings({ weatherCity: e.target.value })}
                placeholder="广州"
              />
            </div>
            <div className="field">
              <label htmlFor="set-homedash-url">homedash 服务地址（仅存在本机）</label>
              <input
                id="set-homedash-url"
                type="url"
                value={settings.homedashUrl}
                onChange={(e) => onChangeSettings({ homedashUrl: e.target.value })}
                placeholder="http://192.0.2.10:3000"
              />
            </div>
            <div className="field">
              <label htmlFor="set-homedash-token">homedash 访问令牌（可选，预留字段）</label>
              <input
                id="set-homedash-token"
                type="password"
                value={settings.homedashToken}
                onChange={(e) => onChangeSettings({ homedashToken: e.target.value })}
                placeholder="默认留空"
              />
            </div>
            <div className="set-row">
              <span>未配置 homedash 时隐藏相关组件</span>
              <button
                type="button"
                className={`toggle ${settings.hideUnconfiguredHomedash ? 'on' : ''}`}
                aria-label="未配置 homedash 时隐藏相关组件"
                aria-pressed={settings.hideUnconfiguredHomedash}
                onClick={() =>
                  onChangeSettings({
                    hideUnconfiguredHomedash: !settings.hideUnconfiguredHomedash,
                  })
                }
              />
            </div>
          </div>

          <div className="blk">
            <h3>布局备份</h3>
            <button type="button" className="btn row" onClick={onExportJson}>
              导出 JSON
            </button>
            <button type="button" className="btn row" onClick={() => fileRef.current?.click()}>
              导入 JSON
            </button>
            <button type="button" className="btn row danger" onClick={onResetCurrentGroup}>
              重置当前分组
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={handleFile}
            />
          </div>
        </div>
      </aside>
    </>
  );
}
