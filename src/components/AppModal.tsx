import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import type { AppTilePayload } from '../lib/boardOps';
import {
  colorFrom,
  domainOf,
  faviconOf,
  isSafeHttpUrl,
  isSafeIconUrl,
  normalizeUrl,
  SWATCHES,
} from '../lib/url';
import type { AppTile, FolderTile, Group } from '../types';
import { TileFace } from './TileFace';

interface AppModalProps {
  mode: 'add' | 'edit';
  initialTile?: AppTile;
  initialGroupId: string;
  initialFolderId?: string;
  groups: Group[];
  onClose: () => void;
  onSubmit: (payload: AppTilePayload, groupId: string, folderId: string) => void;
  onToast: (msg: string) => void;
}

export function AppModal({
  mode,
  initialTile,
  initialGroupId,
  initialFolderId = '',
  groups,
  onClose,
  onSubmit,
  onToast,
}: AppModalProps) {
  const [url, setUrl] = useState(initialTile?.url ?? '');
  const [name, setName] = useState(initialTile?.name ?? '');
  const [nameLocked, setNameLocked] = useState(Boolean(initialTile?.name));
  const [color, setColor] = useState(initialTile?.color ?? '#5b7c99');
  const [iconUrl, setIconUrl] = useState(initialTile?.iconUrl ?? '');
  const [groupId, setGroupId] = useState(initialGroupId);
  const [folderId, setFolderId] = useState(initialFolderId);

  const selectedGroup = groups.find((g) => g.id === groupId) ?? groups[0];
  const folders = (selectedGroup?.items ?? []).filter(
    (it): it is FolderTile => it.type === 'folder',
  );

  // 自动补全域名、默认配色和 Google s2 favicon
  useEffect(() => {
    const normalized = normalizeUrl(url);
    const domain = domainOf(normalized);
    if (!domain) return;

    const timer = window.setTimeout(() => {
      if (!nameLocked) {
        setName(domain);
        if (mode === 'add') {
          setColor(colorFrom(domain));
        }
      }
      setIconUrl((prev) => {
        if (!prev.trim() || prev.includes('google.com/s2/favicons')) {
          return faviconOf(normalized);
        }
        return prev;
      });
    }, 240);

    return () => window.clearTimeout(timer);
  }, [url, nameLocked, mode]);

  const handleUploadIcon = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 512 * 1024) {
      onToast('图片较大（建议 512KB 以内），可能占用较多本地存储');
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setIconUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized || !isSafeHttpUrl(normalized)) {
      onToast('请填写有效的 http / https 网址');
      return;
    }
    const finalName = name.trim() || domainOf(normalized);
    if (!finalName) {
      onToast('请填写网站名称');
      return;
    }
    if (!isSafeIconUrl(iconUrl)) {
      onToast('图标链接格式不受支持');
      return;
    }

    onSubmit(
      {
        name: finalName,
        url: normalized,
        color,
        icon: iconUrl.trim() ? null : (initialTile?.icon ?? null),
        iconUrl: iconUrl.trim() || undefined,
      },
      groupId,
      folderId,
    );
  };

  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit}>
        <h3>{mode === 'edit' ? '编辑网址' : '添加网址'}</h3>
        <p className="hint">输入网址后会自动抓取图标并预填域名，也可自定义名称或上传本地图标。</p>
        <div className="add-preview">
          <TileFace
            name={name.trim() || domainOf(url) || '?'}
            color={color}
            icon={iconUrl.trim() ? null : initialTile?.icon}
            iconUrl={iconUrl.trim() || undefined}
          />
          <div style={{ color: 'var(--faint)', fontSize: 12 }}>图标实时预览</div>
        </div>
        <div className="field">
          <label htmlFor="app-url">网址</label>
          <input
            id="app-url"
            type="text"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://github.com 或 github.com"
          />
        </div>
        <div className="field">
          <label htmlFor="app-name">名称</label>
          <input
            id="app-name"
            type="text"
            value={name}
            onChange={(e) => {
              const val = e.target.value;
              setName(val);
              setNameLocked(Boolean(val.trim()));
            }}
            placeholder="自动填入域名"
          />
        </div>
        <div className="field">
          <label>背景色</label>
          <div className="swatches">
            {SWATCHES.map((swatch) => (
              <button
                key={swatch}
                type="button"
                className={`swatch ${swatch.toLowerCase() === color.toLowerCase() ? 'on' : ''}`}
                style={{ background: swatch }}
                onClick={() => setColor(swatch)}
                aria-label={`选择颜色 ${swatch}`}
              />
            ))}
          </div>
          <input
            type="color"
            value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#5b7c99'}
            onChange={(e) => setColor(e.target.value)}
            style={{
              marginTop: 6,
              width: 42,
              height: 28,
              border: 0,
              background: 'transparent',
              padding: 0,
            }}
            aria-label="自定义背景色"
          />
        </div>
        <div className="field">
          <label htmlFor="app-icon-url">图标链接（可选，或上传本地图片）</label>
          <input
            id="app-icon-url"
            type="text"
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="自动获取 favicon，失败则回退首字母"
          />
          <label className="btn file-btn" htmlFor="app-icon-file">
            上传本地图标
          </label>
          <input
            id="app-icon-file"
            type="file"
            accept="image/*"
            hidden
            onChange={handleUploadIcon}
          />
        </div>
        <div className="row2">
          <div className="field">
            <label htmlFor="app-group">分组</label>
            <select
              id="app-group"
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setFolderId('');
              }}
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="app-folder">文件夹</label>
            <select id="app-folder" value={folderId} onChange={(e) => setFolderId(e.target.value)}>
              <option value="">放在分组根目录</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn primary">
            保存
          </button>
        </div>
      </form>
    </div>
  );
}
