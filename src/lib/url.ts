export const SWATCHES = [
  '#24292f',
  '#5e6ad2',
  '#ea4335',
  '#2a241c',
  '#c4a16a',
  '#3d8b6e',
  '#0c2b3c',
  '#00a1d6',
  '#ff2442',
  '#3b82f6',
  '#5b7c99',
  '#4b5563',
];

export function uid(prefix = 'i'): string {
  return `${prefix}${Math.random().toString(36).slice(2, 9)}`;
}

export function normalizeUrl(raw: string): string {
  const u = String(raw ?? '').trim();
  if (!u) return '';
  if (/^[a-z][a-z0-9+.-]*:/i.test(u)) return u;
  return `https://${u}`;
}

export function isSafeHttpUrl(raw: string): boolean {
  try {
    const parsed = new URL(normalizeUrl(raw));
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeIconUrl(raw: string): boolean {
  const val = String(raw ?? '').trim();
  if (!val) return true;
  if (/^data:image\/(png|jpeg|jpg|gif|webp|svg\+xml|x-icon|bmp);base64,/i.test(val)) {
    return true;
  }
  return isSafeHttpUrl(val);
}

export function domainOf(raw: string): string {
  try {
    return new URL(normalizeUrl(raw)).hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function faviconOf(raw: string): string {
  const domain = domainOf(raw);
  return domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : '';
}

export function lettersOf(name: string): string {
  const parts = String(name).trim().split(/\s+/);
  const first = parts[0] ?? '';
  if (!first) return '?';
  if (/[A-Za-z]/.test(first[0] ?? '')) {
    if (parts.length >= 2 && /[A-Za-z]/.test(parts[1][0] ?? '')) {
      return (first[0] + parts[1][0]).toUpperCase();
    }
    return first.slice(0, 2).toUpperCase();
  }
  return first.slice(0, 1);
}

export function colorFrom(name: string): string {
  const palette = [
    '#5b7c99',
    '#c4a16a',
    '#3d8b6e',
    '#5e6ad2',
    '#c45d42',
    '#2a241c',
    '#0c2b3c',
    '#00a1d6',
  ];
  let hash = 0;
  for (const ch of String(name)) {
    hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  }
  return palette[hash % palette.length];
}

export function daysUntil(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86400000);
}
