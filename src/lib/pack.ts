export interface Packable {
  w?: number;
  h?: number;
}

export type PackedTile<T extends Packable> = T & {
  x: number;
  y: number;
  w: number;
  h: number;
};

/** 二维网格自动装箱：支持 1x1 图标与 2x2 / 2x1 / 1x1 小组件混排 */
export function packTiles<T extends Packable>(items: T[], cols: number): PackedTile<T>[] {
  const safeCols = Math.max(1, Math.floor(cols));
  const occupied: boolean[][] = [];

  const ensureRow = (rowIdx: number) => {
    while (occupied.length <= rowIdx) {
      occupied.push(Array<boolean>(safeCols).fill(false));
    }
  };

  const fits = (x: number, y: number, w: number, h: number): boolean => {
    if (x + w > safeCols) return false;
    for (let r = y; r < y + h; r += 1) {
      ensureRow(r);
      for (let c = x; c < x + w; c += 1) {
        if (occupied[r][c]) return false;
      }
    }
    return true;
  };

  const mark = (x: number, y: number, w: number, h: number) => {
    for (let r = y; r < y + h; r += 1) {
      ensureRow(r);
      for (let c = x; c < x + w; c += 1) {
        occupied[r][c] = true;
      }
    }
  };

  const placed: PackedTile<T>[] = [];
  for (const item of items) {
    const w = Math.min(Math.max(1, Math.floor(item.w ?? 1)), safeCols);
    const h = Math.max(1, Math.floor(item.h ?? 1));
    let done = false;
    for (let y = 0; !done; y += 1) {
      ensureRow(y);
      for (let x = 0; x <= safeCols - w; x += 1) {
        if (fits(x, y, w, h)) {
          mark(x, y, w, h);
          placed.push({ ...item, x, y, w, h });
          done = true;
          break;
        }
      }
    }
  }
  return placed;
}
