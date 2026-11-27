import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  danger?: boolean;
  onClick: () => void;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x, top: y });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pad = 8;
    const nx = Math.min(x, window.innerWidth - el.offsetWidth - pad);
    const ny = Math.min(y, window.innerHeight - el.offsetHeight - pad);
    setPos({ left: Math.max(pad, nx), top: Math.max(pad, ny) });
  }, [x, y, items.length]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [onClose]);

  return (
    <div ref={ref} className="ctx" style={{ left: pos.left, top: pos.top }} role="menu">
      {items.map((item, idx) => (
        <button
          key={`${item.label}-${idx}`}
          type="button"
          className={item.danger ? 'danger' : ''}
          onClick={() => {
            onClose();
            item.onClick();
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
