import { useState, type FormEvent } from 'react';
import { uid } from '../../lib/url';
import type { TodoItem } from '../../types';

interface TodosWidgetProps {
  items: TodoItem[];
  onChange: (items: TodoItem[]) => void;
}

export function TodosWidget({ items, onChange }: TodosWidgetProps) {
  const [draft, setDraft] = useState('');

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onChange([...items, { id: uid('td'), text, done: false }]);
    setDraft('');
  };

  const handleToggle = (id: string, done: boolean) => {
    onChange(items.map((it) => (it.id === id ? { ...it, done } : it)));
  };

  const handleDelete = (id: string) => {
    onChange(items.filter((it) => it.id !== id));
  };

  return (
    <div className="wcard">
      <div className="wh">
        <span>待办</span>
        <div className="wh-right">
          <span>
            {items.filter((i) => !i.done).length}/{items.length}
          </span>
        </div>
      </div>
      <div className="wb">
        {items.length === 0 && (
          <div style={{ fontSize: 12, color: 'var(--faint)', padding: '6px 0' }}>
            暂无待办事项，在下方新增一条
          </div>
        )}
        {items.map((item) => (
          <label key={item.id} className={`todo ${item.done ? 'done' : ''}`}>
            <input
              type="checkbox"
              checked={item.done}
              onChange={(e) => handleToggle(item.id, e.target.checked)}
            />
            <span title={item.text}>{item.text}</span>
            <button
              type="button"
              className="todo-del"
              onClick={() => handleDelete(item.id)}
              aria-label={`删除 ${item.text}`}
              data-no-drag="1"
            >
              ×
            </button>
          </label>
        ))}
        <form className="todo-add" onSubmit={handleAdd}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="添加待办"
          />
          <button className="btn" type="submit" data-no-drag="1">
            添加
          </button>
        </form>
      </div>
    </div>
  );
}
