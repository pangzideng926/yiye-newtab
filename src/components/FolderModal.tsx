import type { MouseEvent, PointerEvent } from 'react';
import type { AppTile, FolderTile } from '../types';
import { TileFace } from './TileFace';

interface FolderModalProps {
  folder: FolderTile;
  editing: boolean;
  draggingId: string | null;
  passthrough: boolean;
  onClose: () => void;
  onRenameFolder: () => void;
  onChildPointerDown: (e: PointerEvent<HTMLElement>, id: string) => void;
  onChildClick: (child: AppTile) => void;
  onChildContextMenu: (e: MouseEvent, child: AppTile) => void;
  onDeleteChild: (id: string) => void;
}

export function FolderModal({
  folder,
  editing,
  draggingId,
  passthrough,
  onClose,
  onRenameFolder,
  onChildPointerDown,
  onChildClick,
  onChildContextMenu,
  onDeleteChild,
}: FolderModalProps) {
  return (
    <div
      className={`folder-mask ${passthrough ? 'drag-passthrough' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="folder-pop" id="folder-pop">
        <div className="box">
          <div className="fg">
            {folder.children.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', color: 'var(--faint)', fontSize: 13 }}>
                把图标拖进来，或在添加网址时选择此文件夹
              </div>
            ) : (
              folder.children.map((child) => (
                <div
                  key={child.id}
                  className={`tile app ${draggingId === child.id ? 'dragging' : ''}`}
                  data-fid={child.id}
                  onPointerDown={(e) => onChildPointerDown(e, child.id)}
                  onClick={() => onChildClick(child)}
                  onContextMenu={(e) => onChildContextMenu(e, child)}
                >
                  <div style={{ position: 'relative' }}>
                    {editing && (
                      <button
                        type="button"
                        className="del-badge"
                        data-no-drag="1"
                        aria-label="删除"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteChild(child.id);
                        }}
                      >
                        −
                      </button>
                    )}
                    <TileFace
                      name={child.name}
                      color={child.color}
                      icon={child.icon}
                      iconUrl={child.iconUrl}
                    />
                  </div>
                  <div className="label">{child.name}</div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="fname-row">
          <div className="fname">{folder.name}</div>
          <button type="button" className="folder-rename-btn" onClick={onRenameFolder}>
            改名
          </button>
        </div>
      </div>
    </div>
  );
}
