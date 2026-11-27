import type { MouseEvent, PointerEvent } from 'react';
import type { DropTarget } from '../hooks/useBoardDrag';
import { WIDGET_META } from '../lib/defaults';
import { packTiles } from '../lib/pack';
import type { Settings, TileItem, WidgetData } from '../types';
import { SvgIcon } from './SvgIcon';
import { TileFace } from './TileFace';
import { CalendarWidget } from './widgets/CalendarWidget';
import { DevicesWidget, DownloadsWidget, VpsWidget } from './widgets/HomedashWidgets';
import { NotesWidget } from './widgets/NotesWidget';
import { TodosWidget } from './widgets/TodosWidget';
import { WeatherWidget } from './widgets/WeatherWidget';

interface BoardProps {
  items: TileItem[];
  settings: Settings;
  editing: boolean;
  transitionPhase: 'idle' | 'leave' | 'enter';
  draggingId: string | null;
  dropTarget: DropTarget | null;
  onTilePointerDown: (e: PointerEvent<HTMLElement>, id: string, type: TileItem['type']) => void;
  onTileClick: (e: MouseEvent, item: TileItem) => void;
  onTileContextMenu: (e: MouseEvent, item: TileItem) => void;
  onAddTileClick: () => void;
  onAddTileContextMenu: (e: MouseEvent) => void;
  onDeleteTile: (id: string) => void;
  onUpdateWidgetData: (widgetId: string, updater: (prev: WidgetData) => WidgetData) => void;
  onOpenSettings: () => void;
}

export function Board({
  items,
  settings,
  editing,
  transitionPhase,
  draggingId,
  dropTarget,
  onTilePointerDown,
  onTileClick,
  onTileContextMenu,
  onAddTileClick,
  onAddTileContextMenu,
  onDeleteTile,
  onUpdateWidgetData,
  onOpenSettings,
}: BoardProps) {
  const visibleItems = items.filter((item) => {
    if (
      settings.hideUnconfiguredHomedash &&
      !settings.homedashUrl.trim() &&
      item.type === 'widget' &&
      WIDGET_META[item.widget]?.homedash
    ) {
      return false;
    }
    return true;
  });

  type RenderEntry = (TileItem & { kind: 'item' }) | { id: '__add'; kind: 'add'; w: 1; h: 1 };

  const entries: RenderEntry[] = [
    ...visibleItems.map((it) => ({ ...it, kind: 'item' as const })),
    { id: '__add', kind: 'add' as const, w: 1, h: 1 },
  ];

  const placed = packTiles(entries, settings.cols);

  const renderWidgetBody = (item: Extract<TileItem, { type: 'widget' }>) => {
    switch (item.widget) {
      case 'weather':
        return <WeatherWidget city={settings.weatherCity} />;
      case 'calendar':
        return <CalendarWidget />;
      case 'todos':
        return (
          <TodosWidget
            items={item.data?.items ?? []}
            onChange={(nextItems) =>
              onUpdateWidgetData(item.id, (prev) => ({ ...prev, items: nextItems }))
            }
          />
        );
      case 'notes':
        return (
          <NotesWidget
            content={item.data?.content ?? ''}
            onChange={(content) => onUpdateWidgetData(item.id, (prev) => ({ ...prev, content }))}
          />
        );
      case 'devices':
        return (
          <DevicesWidget
            homedashUrl={settings.homedashUrl}
            homedashToken={settings.homedashToken}
            onOpenSettings={onOpenSettings}
          />
        );
      case 'vps':
        return (
          <VpsWidget
            homedashUrl={settings.homedashUrl}
            homedashToken={settings.homedashToken}
            onOpenSettings={onOpenSettings}
          />
        );
      case 'downloads':
        return (
          <DownloadsWidget
            homedashUrl={settings.homedashUrl}
            homedashToken={settings.homedashToken}
            onOpenSettings={onOpenSettings}
          />
        );
    }
  };

  return (
    <div className="board-wrap">
      <div className={`board ${transitionPhase !== 'idle' ? transitionPhase : ''}`}>
        {placed.map((entry, idx) => {
          const gridStyle = {
            gridColumn: `${entry.x + 1} / span ${entry.w}`,
            gridRow: `${entry.y + 1} / span ${entry.h}`,
            '--j': idx,
          } as React.CSSProperties;

          if (entry.kind === 'add') {
            return (
              <div
                key="__add"
                className="tile add"
                style={gridStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddTileClick();
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAddTileContextMenu(e);
                }}
              >
                <div className="face">
                  <SvgIcon kind="plus" />
                </div>
                <div className="label">添加</div>
              </div>
            );
          }

          const isDragging = draggingId === entry.id;
          const isMerge =
            (dropTarget?.kind === 'merge' && dropTarget.targetId === entry.id) ||
            (dropTarget?.kind === 'into-folder' && dropTarget.folderId === entry.id);
          const isInsertBefore =
            dropTarget?.kind === 'reorder' && dropTarget.targetId === entry.id && !dropTarget.after;
          const isInsertAfter =
            dropTarget?.kind === 'reorder' && dropTarget.targetId === entry.id && dropTarget.after;

          const extraClasses = [
            isDragging ? 'dragging' : '',
            isMerge ? 'drop-merge' : '',
            isInsertBefore ? 'drop-insert-before' : '',
            isInsertAfter ? 'drop-insert-after' : '',
          ]
            .filter(Boolean)
            .join(' ');

          const delBtn = editing ? (
            <button
              type="button"
              className="del-badge"
              data-no-drag="1"
              aria-label="删除"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDeleteTile(entry.id);
              }}
            >
              −
            </button>
          ) : null;

          if (entry.type === 'app') {
            return (
              <div
                key={entry.id}
                className={`tile app ${extraClasses}`}
                data-tile-id={entry.id}
                title={entry.name}
                style={gridStyle}
                onPointerDown={(e) => onTilePointerDown(e, entry.id, 'app')}
                onClick={(e) => onTileClick(e, entry)}
                onContextMenu={(e) => onTileContextMenu(e, entry)}
              >
                <div style={{ position: 'relative' }}>
                  {delBtn}
                  <TileFace
                    name={entry.name}
                    color={entry.color}
                    icon={entry.icon}
                    iconUrl={entry.iconUrl}
                  />
                </div>
                <div className="label">{entry.name}</div>
              </div>
            );
          }

          if (entry.type === 'folder') {
            const previewChildren = entry.children.slice(0, 4);
            const placeholders = Math.max(0, 4 - previewChildren.length);
            return (
              <div
                key={entry.id}
                className={`tile folder ${extraClasses}`}
                data-tile-id={entry.id}
                title={entry.name}
                style={gridStyle}
                onPointerDown={(e) => onTilePointerDown(e, entry.id, 'folder')}
                onClick={(e) => onTileClick(e, entry)}
                onContextMenu={(e) => onTileContextMenu(e, entry)}
              >
                <div style={{ position: 'relative' }}>
                  {delBtn}
                  <div className="face">
                    <div className="folder-mini">
                      {previewChildren.map((child) => (
                        <i key={child.id} style={{ background: child.color || '#5b7c99' }} />
                      ))}
                      {Array.from({ length: placeholders }).map((_, i) => (
                        <i key={`p-${i}`} style={{ background: 'rgba(255,255,255,0.12)' }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="label">{entry.name}</div>
              </div>
            );
          }

          return (
            <div
              key={entry.id}
              className={`tile widget ${extraClasses}`}
              data-tile-id={entry.id}
              style={gridStyle}
              onPointerDown={(e) => onTilePointerDown(e, entry.id, 'widget')}
              onContextMenu={(e) => onTileContextMenu(e, entry)}
            >
              {delBtn}
              {renderWidgetBody(entry)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
