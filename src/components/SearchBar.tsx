import { useEffect, useRef, useState, type FormEvent } from 'react';
import { resolveSearchTarget, SEARCH_ENGINES } from '../lib/search';
import type { EngineId } from '../types';

interface SearchBarProps {
  engine: EngineId;
  onChangeEngine: (engine: EngineId) => void;
  onNavigate?: (url: string) => void;
}

export function SearchBar({ engine, onChangeEngine, onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const currentEngine = SEARCH_ENGINES.find((e) => e.id === engine) ?? SEARCH_ENGINES[0];

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const resolved = resolveSearchTarget(query, engine);
    if (!resolved) return;
    if (onNavigate) {
      onNavigate(resolved.url);
    } else {
      window.open(resolved.url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <form ref={formRef} className="search-form" autoComplete="off" onSubmit={handleSubmit}>
      <button
        type="button"
        className="engine-btn"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((v) => !v);
        }}
        aria-label="切换搜索引擎"
      >
        <span className="engine-badge">{currentEngine.short}</span>
        <span>{currentEngine.name}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <input
        className="search-input"
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索或输入网址直达"
      />
      <button className="search-go" type="submit" aria-label="搜索">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3-3" />
        </svg>
      </button>
      {menuOpen && (
        <div className="engine-menu" role="menu">
          {SEARCH_ENGINES.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === currentEngine.id ? 'on' : ''}
              onClick={() => {
                onChangeEngine(item.id);
                setMenuOpen(false);
              }}
            >
              <span className="engine-badge">{item.short}</span>
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
