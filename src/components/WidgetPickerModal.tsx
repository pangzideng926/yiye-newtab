import { WIDGET_META } from '../lib/defaults';
import type { WidgetKind } from '../types';

interface WidgetPickerModalProps {
  onClose: () => void;
  onPick: (kind: WidgetKind) => void;
}

export function WidgetPickerModal({ onClose, onPick }: WidgetPickerModalProps) {
  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal">
        <h3>添加小组件</h3>
        <p className="hint">小组件默认尺寸为 2×2，可与图标混排在同一网格中。</p>
        <div className="widget-picker-grid">
          {(
            Object.entries(WIDGET_META) as Array<[WidgetKind, (typeof WIDGET_META)[WidgetKind]]>
          ).map(([kind, meta]) => (
            <button
              key={kind}
              type="button"
              className="widget-pick-btn"
              onClick={() => onPick(kind)}
            >
              <div className="widget-pick-title">
                {meta.name}
                {meta.homedash ? ' · homedash' : ''}
              </div>
              <div className="widget-pick-desc">{meta.description}</div>
            </button>
          ))}
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
