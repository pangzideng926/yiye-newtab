import { useCallback, useEffect, useRef, useState, type MouseEvent, type WheelEvent } from 'react';
import { AppModal } from './components/AppModal';
import { Board } from './components/Board';
import { ClockHero } from './components/ClockHero';
import { ContextMenu, type ContextMenuItem } from './components/ContextMenu';
import { FolderModal } from './components/FolderModal';
import { SearchBar } from './components/SearchBar';
import { SettingsDrawer } from './components/SettingsDrawer';
import { Sidebar } from './components/Sidebar';
import { TextModal } from './components/TextModal';
import { Wallpaper } from './components/Wallpaper';
import { WidgetPickerModal } from './components/WidgetPickerModal';
import { useBoardDrag, type DropTarget } from './hooks/useBoardDrag';
import {
  addAppTile,
  addFolderTile,
  addGroup,
  addWidgetTile,
  deleteGroup,
  findTileLocation,
  mergeAppsIntoFolder,
  moveAppIntoFolder,
  moveOutOfFolder,
  moveTileToGroup,
  removeTile,
  renameFolderTile,
  renameGroup,
  reorderInFolder,
  reorderInGroup,
  resetGroupToDefault,
  updateAppTile,
  updateWidgetData,
} from './lib/boardOps';
import { createDefaultState } from './lib/defaults';
import { validateImportJson } from './lib/schema';
import { loadAppState, saveAppState } from './lib/storage';
import type { AppState, AppTile, FolderTile, Group, Settings, TileItem, WidgetData } from './types';

type ActiveModal =
  | { type: 'app-add'; folderId?: string }
  | { type: 'app-edit'; tileId: string }
  | { type: 'new-group' }
  | { type: 'rename-group'; groupId: string; currentName: string }
  | { type: 'new-folder' }
  | { type: 'rename-folder'; folderId: string; currentName: string }
  | { type: 'widget-picker' };

export function App() {
  const [state, setState] = useState<AppState>(() => createDefaultState());
  const [hydrated, setHydrated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const [modal, setModal] = useState<ActiveModal | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{
    x: number;
    y: number;
    items: ContextMenuItem[];
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'leave' | 'enter'>('idle');

  const persistTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const wheelLockRef = useRef(false);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2200);
  }, []);

  // 初始化读取存储
  useEffect(() => {
    let active = true;
    void loadAppState().then((loaded) => {
      if (active) {
        setState(loaded);
        setHydrated(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // 防抖写入存储
  useEffect(() => {
    if (!hydrated) return;
    if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    persistTimerRef.current = window.setTimeout(() => {
      void saveAppState(state);
    }, 100);
    return () => {
      if (persistTimerRef.current) window.clearTimeout(persistTimerRef.current);
    };
  }, [state, hydrated]);

  // 页面关闭前尽量持久化
  useEffect(() => {
    const onUnload = () => {
      if (hydrated) void saveAppState(state);
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, [state, hydrated]);

  // 同步 CSS 变量与 body 编辑状态类
  useEffect(() => {
    const s = state.settings;
    const root = document.documentElement.style;
    root.setProperty('--icon', `${s.icon}px`);
    root.setProperty('--radius', `${s.radius}px`);
    root.setProperty('--gap', `${s.gap}px`);
    root.setProperty('--cols', String(s.cols));
    root.setProperty('--mask', String(s.mask / 100));
    root.setProperty('--blur', `${s.blur}px`);
    root.setProperty('--cell', `${Math.max(s.icon + 8, 96)}px`);
    root.setProperty('--row', `${s.icon + 28}px`);
  }, [state.settings]);

  useEffect(() => {
    document.body.classList.toggle('editing', editing);
  }, [editing]);

  // Esc 快捷键关闭弹层或退出编辑模式
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setOpenFolderId(null);
        setSettingsOpen(false);
        setCtxMenu(null);
        setEditing(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const currentGroup = state.groups.find((g) => g.id === state.group) ?? state.groups[0];
  const openFolderLoc = openFolderId ? findTileLocation(state, openFolderId) : null;
  const openFolder =
    openFolderLoc && openFolderLoc.item.type === 'folder'
      ? (openFolderLoc.item as FolderTile)
      : null;

  const switchGroup = useCallback(
    (targetGroupId: string) => {
      if (targetGroupId === state.group) return;
      setTransitionPhase('leave');
      window.setTimeout(() => {
        setState((prev) => ({ ...prev, group: targetGroupId }));
        setOpenFolderId(null);
        setTransitionPhase('enter');
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => setTransitionPhase('idle'));
        });
      }, 170);
    },
    [state.group],
  );

  const findItemType = useCallback(
    (id: string) => findTileLocation(state, id)?.item.type ?? null,
    [state],
  );

  const handleDrop = useCallback(
    (srcId: string, target: DropTarget) => {
      setState((prev) => {
        let res: { state: AppState; toast?: string } = { state: prev };
        if (target.kind === 'group') {
          res = moveTileToGroup(prev, srcId, target.groupId);
        } else if (target.kind === 'into-folder') {
          res = moveAppIntoFolder(prev, srcId, target.folderId);
        } else if (target.kind === 'merge') {
          res = mergeAppsIntoFolder(prev, srcId, target.targetId);
        } else if (target.kind === 'folder-inside') {
          res = moveAppIntoFolder(prev, srcId, target.folderId);
        } else if (target.kind === 'folder-reorder' && openFolderId) {
          res = reorderInFolder(prev, openFolderId, srcId, target.targetId);
        } else if (target.kind === 'reorder') {
          res = reorderInGroup(prev, currentGroup.id, srcId, target.targetId, target.after);
        }
        if (res.toast) showToast(res.toast);
        return res.state;
      });
    },
    [currentGroup.id, openFolderId, showToast],
  );

  const { draggingId, dropTarget, dragPassthroughFolder, suppressClickRef, startPointerDrag } =
    useBoardDrag({
      openFolderId,
      findItemType,
      onEnterEditMode: () => setEditing(true),
      onDrop: handleDrop,
    });

  const handleTileClick = (e: MouseEvent, item: TileItem) => {
    if (suppressClickRef.current) return;
    if ((e.target as HTMLElement).closest('input, button, form, a, label, .todo-add')) return;
    if (editing) {
      if (item.type === 'app') setModal({ type: 'app-edit', tileId: item.id });
      if (item.type === 'folder') setOpenFolderId(item.id);
      return;
    }
    if (item.type === 'app') {
      window.open(item.url, '_blank', 'noopener,noreferrer');
    } else if (item.type === 'folder') {
      setOpenFolderId(item.id);
    }
  };

  const buildAddMenu = (): ContextMenuItem[] => [
    { label: '添加网址', onClick: () => setModal({ type: 'app-add' }) },
    { label: '添加文件夹', onClick: () => setModal({ type: 'new-folder' }) },
    { label: '添加小组件', onClick: () => setModal({ type: 'widget-picker' }) },
  ];

  const handleTileContextMenu = (e: MouseEvent, item: TileItem) => {
    e.preventDefault();
    e.stopPropagation();
    const loc = findTileLocation(state, item.id);
    if (!loc) return;

    const menu: ContextMenuItem[] = [];
    if (item.type === 'app') {
      menu.push({
        label: '打开',
        onClick: () => window.open(item.url, '_blank', 'noopener,noreferrer'),
      });
      menu.push({
        label: '编辑',
        onClick: () => setModal({ type: 'app-edit', tileId: item.id }),
      });
    } else if (item.type === 'folder') {
      menu.push({ label: '打开文件夹', onClick: () => setOpenFolderId(item.id) });
      menu.push({
        label: '重命名',
        onClick: () =>
          setModal({ type: 'rename-folder', folderId: item.id, currentName: item.name }),
      });
    }

    state.groups
      .filter((g) => g.id !== loc.group.id)
      .forEach((g) => {
        menu.push({
          label: `移动到「${g.name}」`,
          onClick: () => {
            const res = moveTileToGroup(state, item.id, g.id);
            setState(res.state);
            if (res.toast) showToast(res.toast);
          },
        });
      });

    if (loc.folder) {
      menu.push({
        label: '移出文件夹',
        onClick: () => {
          const res = moveOutOfFolder(state, item.id);
          setState(res.state);
          if (res.toast) showToast(res.toast);
        },
      });
    }

    menu.push({
      label: '删除',
      danger: true,
      onClick: () => {
        const res = removeTile(state, item.id);
        setState(res.state);
        if (res.toast) showToast(res.toast);
      },
    });

    setCtxMenu({ x: e.clientX, y: e.clientY, items: menu });
  };

  const handleGroupContextMenu = (e: MouseEvent, group: Group) => {
    e.preventDefault();
    e.stopPropagation();
    const items: ContextMenuItem[] = [
      {
        label: '重命名分组',
        onClick: () =>
          setModal({ type: 'rename-group', groupId: group.id, currentName: group.name }),
      },
    ];
    if (state.groups.length > 1) {
      items.push({
        label: '删除分组',
        danger: true,
        onClick: () => {
          const res = deleteGroup(state, group.id);
          setState(res.state);
          if (res.toast) showToast(res.toast);
        },
      });
    }
    setCtxMenu({ x: e.clientX, y: e.clientY, items });
  };

  const handleMainWheel = (e: WheelEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('.wcard, .settings, .folder-mask, .modal-mask')) return;
    if (Math.abs(e.deltaY) < 24 || wheelLockRef.current) return;
    const idx = state.groups.findIndex((g) => g.id === currentGroup.id);
    if (idx < 0 || state.groups.length <= 1) return;
    const nextIdx =
      e.deltaY > 0
        ? (idx + 1) % state.groups.length
        : (idx - 1 + state.groups.length) % state.groups.length;
    switchGroup(state.groups[nextIdx].id);
    wheelLockRef.current = true;
    window.setTimeout(() => {
      wheelLockRef.current = false;
    }, 480);
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'yiye-newtab-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('已导出布局 JSON');
  };

  const handleImportJsonFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        showToast('导入失败：文件读取异常');
        return;
      }
      const res = validateImportJson(reader.result);
      if (!res.ok) {
        showToast(`导入失败：${res.error}`);
        return;
      }
      setState(res.data);
      setOpenFolderId(null);
      showToast('已导入布局');
    };
    reader.readAsText(file);
  };

  const editLoc = modal?.type === 'app-edit' ? findTileLocation(state, modal.tileId) : null;
  const editAppTile =
    editLoc && editLoc.item.type === 'app' ? (editLoc.item as AppTile) : undefined;

  return (
    <>
      <Wallpaper wallpaperId={state.settings.wallpaper} customUrl={state.settings.wallUrl} />
      <div className="app-shell">
        {state.settings.side && (
          <Sidebar
            groups={state.groups}
            activeGroupId={currentGroup.id}
            dropGroupId={dropTarget?.kind === 'group' ? dropTarget.groupId : null}
            onSelectGroup={switchGroup}
            onAddGroup={() => setModal({ type: 'new-group' })}
            onGroupContextMenu={handleGroupContextMenu}
            onAddUrl={() => setModal({ type: 'app-add' })}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}

        <main
          className="main"
          onWheel={handleMainWheel}
          onContextMenu={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.tile, .wcard, .search-form, .sidebar, .settings')) return;
            e.preventDefault();
            setCtxMenu({
              x: e.clientX,
              y: e.clientY,
              items: [...buildAddMenu(), { label: '设置', onClick: () => setSettingsOpen(true) }],
            });
          }}
        >
          <div className="main-actions">
            {!state.settings.side && (
              <button type="button" onClick={() => setSettingsOpen(true)}>
                设置
              </button>
            )}
            <button type="button" onClick={() => setModal({ type: 'app-add' })}>
              ＋ 添加网址
            </button>
            <button
              type="button"
              className={editing ? 'is-editing' : ''}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? '完成' : '编辑'}
            </button>
          </div>

          <ClockHero
            showClock={state.settings.clock}
            showDate={state.settings.date}
            showLunar={state.settings.lunar}
          />

          {state.settings.search && (
            <SearchBar
              engine={state.engine}
              onChangeEngine={(engine) => setState((prev) => ({ ...prev, engine }))}
            />
          )}

          <Board
            items={currentGroup.items}
            settings={state.settings}
            editing={editing}
            transitionPhase={transitionPhase}
            draggingId={draggingId}
            dropTarget={dropTarget}
            onTilePointerDown={startPointerDrag}
            onTileClick={handleTileClick}
            onTileContextMenu={handleTileContextMenu}
            onAddTileClick={() => setModal({ type: 'app-add' })}
            onAddTileContextMenu={(e) =>
              setCtxMenu({ x: e.clientX, y: e.clientY, items: buildAddMenu() })
            }
            onDeleteTile={(id) => {
              const res = removeTile(state, id);
              setState(res.state);
              if (res.toast) showToast(res.toast);
            }}
            onUpdateWidgetData={(widgetId: string, updater: (prev: WidgetData) => WidgetData) =>
              setState((prev) => updateWidgetData(prev, widgetId, updater))
            }
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <nav className="dots" aria-label="分组分页">
            {state.groups.map((g) => (
              <button
                key={g.id}
                type="button"
                className={g.id === currentGroup.id ? 'on' : ''}
                title={g.name}
                aria-label={`切换到 ${g.name}`}
                onClick={() => switchGroup(g.id)}
              />
            ))}
          </nav>
        </main>
      </div>

      <SettingsDrawer
        open={settingsOpen}
        settings={state.settings}
        onClose={() => setSettingsOpen(false)}
        onChangeSettings={(patch: Partial<Settings>) =>
          setState((prev) => ({
            ...prev,
            settings: { ...prev.settings, ...patch },
          }))
        }
        onExportJson={handleExportJson}
        onImportJsonFile={handleImportJsonFile}
        onResetCurrentGroup={() => {
          const res = resetGroupToDefault(state, currentGroup.id);
          setState(res.state);
          if (res.toast) showToast(res.toast);
        }}
      />

      {openFolder && (
        <FolderModal
          folder={openFolder}
          editing={editing}
          draggingId={draggingId}
          passthrough={dragPassthroughFolder}
          onClose={() => setOpenFolderId(null)}
          onRenameFolder={() =>
            setModal({
              type: 'rename-folder',
              folderId: openFolder.id,
              currentName: openFolder.name,
            })
          }
          onChildPointerDown={(e, id) => startPointerDrag(e, id, 'app')}
          onChildClick={(child) => {
            if (suppressClickRef.current) return;
            if (editing) {
              setModal({ type: 'app-edit', tileId: child.id });
              return;
            }
            window.open(child.url, '_blank', 'noopener,noreferrer');
          }}
          onChildContextMenu={(e, child) => handleTileContextMenu(e, child)}
          onDeleteChild={(id) => {
            const res = removeTile(state, id);
            setState(res.state);
            if (res.toast) showToast(res.toast);
          }}
        />
      )}

      {(modal?.type === 'app-add' || (modal?.type === 'app-edit' && editAppTile)) && (
        <AppModal
          mode={modal.type === 'app-edit' ? 'edit' : 'add'}
          initialTile={editAppTile}
          initialGroupId={editLoc?.group.id ?? currentGroup.id}
          initialFolderId={modal.type === 'app-add' ? modal.folderId : (editLoc?.folder?.id ?? '')}
          groups={state.groups}
          onClose={() => setModal(null)}
          onToast={showToast}
          onSubmit={(payload, gid, fid) => {
            if (modal.type === 'app-edit' && editAppTile) {
              const res = updateAppTile(state, editAppTile.id, payload, gid, fid || undefined);
              setState(res.state);
              if (res.toast) showToast(res.toast);
            } else {
              const res = addAppTile(state, payload, gid, fid || undefined);
              setState(res.state);
              if (res.toast) showToast(res.toast);
            }
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'new-group' && (
        <TextModal
          title="新建分组"
          label="分组名称"
          placeholder="例如：学习"
          onClose={() => setModal(null)}
          onToast={showToast}
          onConfirm={(name) => {
            const res = addGroup(state, name);
            setState(res.state);
            if (res.toast) showToast(res.toast);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'rename-group' && (
        <TextModal
          title="重命名分组"
          label="分组名称"
          initialValue={modal.currentName}
          onClose={() => setModal(null)}
          onToast={showToast}
          onConfirm={(name) => {
            const res = renameGroup(state, modal.groupId, name);
            setState(res.state);
            if (res.toast) showToast(res.toast);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'new-folder' && (
        <TextModal
          title="新建文件夹"
          label="文件夹名称"
          placeholder="例如：常用工具"
          onClose={() => setModal(null)}
          onToast={showToast}
          onConfirm={(name) => {
            const res = addFolderTile(state, currentGroup.id, name);
            setState(res.state);
            if (res.toast) showToast(res.toast);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'rename-folder' && (
        <TextModal
          title="重命名文件夹"
          label="文件夹名称"
          initialValue={modal.currentName}
          onClose={() => setModal(null)}
          onToast={showToast}
          onConfirm={(name) => {
            const res = renameFolderTile(state, modal.folderId, name);
            setState(res.state);
            if (res.toast) showToast(res.toast);
            setModal(null);
          }}
        />
      )}

      {modal?.type === 'widget-picker' && (
        <WidgetPickerModal
          onClose={() => setModal(null)}
          onPick={(kind) => {
            const res = addWidgetTile(state, currentGroup.id, kind);
            setState(res.state);
            if (res.toast) showToast(res.toast);
            setModal(null);
          }}
        />
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          items={ctxMenu.items}
          onClose={() => setCtxMenu(null)}
        />
      )}

      <div className={`toast ${toastMsg ? 'show' : ''}`}>{toastMsg ?? ''}</div>
    </>
  );
}

export default App;
