import type { MouseEvent } from 'react';
import type { Group } from '../types';
import { SvgIcon } from './SvgIcon';

interface SidebarProps {
  groups: Group[];
  activeGroupId: string;
  dropGroupId: string | null;
  onSelectGroup: (groupId: string) => void;
  onAddGroup: () => void;
  onGroupContextMenu: (e: MouseEvent, group: Group) => void;
  onAddUrl: () => void;
  onOpenSettings: () => void;
}

export function Sidebar({
  groups,
  activeGroupId,
  dropGroupId,
  onSelectGroup,
  onAddGroup,
  onGroupContextMenu,
  onAddUrl,
  onOpenSettings,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="分组导航">
      <div className="logo" title="一页">
        一
      </div>
      <div className="side-list">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`side-btn ${g.id === activeGroupId ? 'active' : ''} ${
              dropGroupId === g.id ? 'drop-target' : ''
            }`}
            data-drop-gid={g.id}
            onClick={() => onSelectGroup(g.id)}
            onContextMenu={(e) => onGroupContextMenu(e, g)}
            aria-label={g.name}
          >
            <SvgIcon kind={g.icon || 'bag'} size={20} />
            <small>{g.name}</small>
          </button>
        ))}
        <button type="button" className="side-btn" onClick={onAddGroup} aria-label="新建分组">
          <SvgIcon kind="plus" size={20} />
          <small>新建分组</small>
        </button>
      </div>
      <div className="side-bottom">
        <button type="button" className="side-btn" onClick={onAddUrl} aria-label="添加网址">
          <SvgIcon kind="plus" size={20} />
          <small>添加网址</small>
        </button>
        <button type="button" className="side-btn" onClick={onOpenSettings} aria-label="设置">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 3v2M12 19v2M5 12H3M21 12h-2M6.2 6.2l1.4 1.4M16.4 16.4l1.4 1.4M6.2 17.8l1.4-1.4M16.4 7.6l1.4-1.4" />
          </svg>
          <small>设置</small>
        </button>
      </div>
    </aside>
  );
}
