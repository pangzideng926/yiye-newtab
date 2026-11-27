import type { IconKind } from '../types';

interface SvgIconProps {
  kind: IconKind;
  size?: number;
}

export function SvgIcon({ kind, size }: SvgIconProps) {
  const style = size ? { width: size, height: size } : undefined;
  return (
    <svg viewBox="0 0 24 24" style={style} aria-hidden="true">
      {kind === 'github' && (
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.12-1.47-1.12-1.47-.92-.63.07-.62.07-.62 1 .07 1.53 1.04 1.53 1.04.9 1.53 2.36 1.09 2.94.83.09-.65.35-1.09.63-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.1.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02A9.56 9.56 0 0 1 12 6.8c.85 0 1.7.11 2.5.33 1.9-1.29 2.74-1.02 2.74-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z"
        />
      )}
      {kind === 'mail' && (
        <>
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      )}
      {kind === 'code' && (
        <path
          d="m8 8-4 4 4 4M16 8l4 4-4 4M13 5l-2 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
      {kind === 'play' && <path fill="currentColor" d="M9 7.5v9l8-4.5-8-4.5z" />}
      {kind === 'cloud' && (
        <path
          d="M7 17h10a4 4 0 0 0 0-8 6 6 0 0 0-11-2A4 4 0 0 0 7 17z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      )}
      {kind === 'home' && (
        <path
          d="M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-8z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      )}
      {kind === 'server' && (
        <>
          <rect
            x="4"
            y="4"
            width="16"
            height="6"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <rect
            x="4"
            y="14"
            width="16"
            height="6"
            rx="1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M8 7h.01M8 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      {kind === 'bolt' && <path d="M13 3 5 13h7l-1 8 8-10h-7l1-8z" fill="currentColor" />}
      {kind === 'shop' && (
        <path
          d="M4 8h16l-1.2 11H5.2L4 8zm3-4h10l1 4H6l1-4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
      {kind === 'plus' && (
        <path
          d="M12 6v12M6 12h12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {kind === 'bag' && (
        <>
          <rect
            x="6"
            y="7"
            width="12"
            height="13"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path d="M9 7V6a3 3 0 0 1 6 0v1" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </>
      )}
      {kind === 'game' && (
        <>
          <rect
            x="3"
            y="8"
            width="18"
            height="10"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="M8 13h4M10 11v4M16 12h.01M18 14h.01"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'book' && (
        <path
          d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16zM4 18.5A2.5 2.5 0 0 1 6.5 16H20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      )}
      {kind === 'music' && (
        <path
          d="M9 17V6l10-2v11M9 17a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0zm10-2a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {kind === 'compass' && (
        <>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" />
          <path d="m15 9-2 6-6 2 2-6 6-2z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
