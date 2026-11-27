import { useState, type FormEvent } from 'react';

interface TextModalProps {
  title: string;
  label: string;
  placeholder?: string;
  initialValue?: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  onToast: (msg: string) => void;
}

export function TextModal({
  title,
  label,
  placeholder,
  initialValue = '',
  onClose,
  onConfirm,
  onToast,
}: TextModalProps) {
  const [value, setValue] = useState(initialValue);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      onToast('请输入名称');
      return;
    }
    onConfirm(trimmed);
  };

  return (
    <div
      className="modal-mask"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form className="modal" onSubmit={handleSubmit}>
        <h3>{title}</h3>
        <div className="field">
          <label htmlFor="text-modal-input">{label}</label>
          <input
            id="text-modal-input"
            type="text"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
          />
        </div>
        <div className="actions">
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button type="submit" className="btn primary">
            确定
          </button>
        </div>
      </form>
    </div>
  );
}
