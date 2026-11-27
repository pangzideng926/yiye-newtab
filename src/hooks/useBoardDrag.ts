import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { TileItem } from '../types';

export type DropTarget =
  | { kind: 'group'; groupId: string }
  | { kind: 'merge'; targetId: string }
  | { kind: 'into-folder'; folderId: string }
  | { kind: 'reorder'; targetId: string; after: boolean }
  | { kind: 'folder-reorder'; targetId: string }
  | { kind: 'folder-inside'; folderId: string };

interface DragState {
  id: string;
  itemType: TileItem['type'];
  startX: number;
  startY: number;
  moved: boolean;
  tileEl: HTMLElement;
  ghostEl: HTMLElement | null;
  longTimer: number | null;
}

interface UseBoardDragOptions {
  openFolderId: string | null;
  findItemType: (id: string) => TileItem['type'] | null;
  onEnterEditMode: () => void;
  onDrop: (srcId: string, target: DropTarget) => void;
}

/**
 * 指针拖拽与长按编辑控制器：
 * 支持排序、双图标合成文件夹、拖入/拖出文件夹、跨分组拖到左侧栏。
 */
export function useBoardDrag({
  openFolderId,
  findItemType,
  onEnterEditMode,
  onDrop,
}: UseBoardDragOptions) {
  const dragRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [dragPassthroughFolder, setDragPassthroughFolder] = useState(false);

  const hitTest = useCallback(
    (x: number, y: number, srcId: string, srcType: TileItem['type']): DropTarget | null => {
      const ghost = dragRef.current?.ghostEl;
      if (ghost) ghost.style.visibility = 'hidden';
      const el = document.elementFromPoint(x, y);
      if (ghost) ghost.style.visibility = 'visible';
      if (!el) return null;

      const sideBtn = el.closest<HTMLElement>('[data-drop-gid]');
      if (sideBtn?.dataset.dropGid) {
        return { kind: 'group', groupId: sideBtn.dataset.dropGid };
      }

      const inFolderPop = el.closest('#folder-pop');
      if (inFolderPop && openFolderId) {
        const kid = el.closest<HTMLElement>('[data-fid]');
        if (kid?.dataset.fid && kid.dataset.fid !== srcId) {
          return { kind: 'folder-reorder', targetId: kid.dataset.fid };
        }
        return { kind: 'folder-inside', folderId: openFolderId };
      }

      const faceEl = el.closest('.tile .face');
      const tileEl = el.closest<HTMLElement>('.tile[data-tile-id]');
      if (faceEl && tileEl?.dataset.tileId && tileEl.dataset.tileId !== srcId) {
        const targetId = tileEl.dataset.tileId;
        const targetType = findItemType(targetId);
        if (srcType === 'app' && targetType === 'folder') {
          return { kind: 'into-folder', folderId: targetId };
        }
        if (srcType === 'app' && targetType === 'app') {
          return { kind: 'merge', targetId };
        }
      }

      if (tileEl?.dataset.tileId && tileEl.dataset.tileId !== srcId) {
        const rect = tileEl.getBoundingClientRect();
        return {
          kind: 'reorder',
          targetId: tileEl.dataset.tileId,
          after: x > rect.left + rect.width / 2,
        };
      }

      return null;
    },
    [findItemType, openFolderId],
  );

  const cleanupDrag = useCallback(() => {
    const d = dragRef.current;
    if (d?.longTimer) window.clearTimeout(d.longTimer);
    if (d?.ghostEl) d.ghostEl.remove();
    dragRef.current = null;
    setDraggingId(null);
    setDropTarget(null);
    setDragPassthroughFolder(false);
  }, []);

  useEffect(() => cleanupDrag, [cleanupDrag]);

  const startPointerDrag = useCallback(
    (e: ReactPointerEvent<HTMLElement>, itemId: string, itemType: TileItem['type']) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, form, label, .todo-add, [data-no-drag]')) return;

      const tileEl = e.currentTarget;
      const longTimer = window.setTimeout(() => {
        if (dragRef.current && !dragRef.current.moved) {
          onEnterEditMode();
        }
      }, 550);

      dragRef.current = {
        id: itemId,
        itemType,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
        tileEl,
        ghostEl: null,
        longTimer,
      };

      const onMove = (ev: PointerEvent) => {
        const d = dragRef.current;
        if (!d) return;
        const dist = Math.hypot(ev.clientX - d.startX, ev.clientY - d.startY);
        if (!d.moved && dist < 8) return;

        if (!d.moved) {
          d.moved = true;
          if (d.longTimer) {
            window.clearTimeout(d.longTimer);
            d.longTimer = null;
          }
          setDraggingId(d.id);
          if (openFolderId) {
            setDragPassthroughFolder(true);
          }
          const ghost = d.tileEl.cloneNode(true) as HTMLElement;
          ghost.classList.add('ghost');
          ghost.classList.remove('dragging');
          ghost.style.width = `${d.tileEl.offsetWidth}px`;
          document.body.appendChild(ghost);
          d.ghostEl = ghost;
        }

        if (d.ghostEl) {
          d.ghostEl.style.left = `${ev.clientX - d.tileEl.offsetWidth / 2}px`;
          d.ghostEl.style.top = `${ev.clientY - 24}px`;
        }

        const hit = hitTest(ev.clientX, ev.clientY, d.id, d.itemType);
        setDropTarget(hit);
      };

      const onUp = (ev: PointerEvent) => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        const d = dragRef.current;
        const wasMoved = Boolean(d?.moved);
        let hit: DropTarget | null = null;
        if (d && wasMoved) {
          hit = hitTest(ev.clientX, ev.clientY, d.id, d.itemType);
        }
        cleanupDrag();

        if (wasMoved) {
          suppressClickRef.current = true;
          window.setTimeout(() => {
            suppressClickRef.current = false;
          }, 30);
          if (hit && d) {
            onDrop(d.id, hit);
          }
        }
      };

      document.addEventListener('pointermove', onMove);
      document.addEventListener('pointerup', onUp);
    },
    [cleanupDrag, hitTest, onDrop, onEnterEditMode, openFolderId],
  );

  return {
    draggingId,
    dropTarget,
    dragPassthroughFolder,
    suppressClickRef,
    startPointerDrag,
  };
}
