// 使用纯 Node 内置模块生成抗锯齿几何扩展图标（PNG 16/32/48/128 与 SVG）
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const SIZES = [16, 32, 48, 128];
const OUT_DIR = path.resolve(process.cwd(), 'public/icons');

/** 计算 CRC32 校验值（PNG 块格式要求） */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (stride + 1);
    raw[rowStart] = 0; // filter type None
    rgba.copy(raw, rowStart + 1, y * stride, (y + 1) * stride);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 圆角矩形有向距离场（SDF） */
function roundedRectSdf(px, py, cx, cy, halfW, halfH, r) {
  const dx = Math.abs(px - cx) - (halfW - r);
  const dy = Math.abs(py - cy) - (halfH - r);
  const outX = Math.max(dx, 0);
  const outY = Math.max(dy, 0);
  return Math.hypot(outX, outY) + Math.min(Math.max(dx, dy), 0) - r;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function blendOver(dst, src, alpha) {
  const a = clamp01(alpha);
  return [
    lerp(dst[0], src[0], a),
    lerp(dst[1], src[1], a),
    lerp(dst[2], src[2], a),
    1 - (1 - dst[3]) * (1 - a),
  ];
}

function renderIconPixels(size) {
  const rgba = Buffer.alloc(size * size * 4);
  const half = size * 0.44;
  const radius = size * 0.24;
  const center = size / 2;
  const aa = 0.85;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      const nx = px / size;
      const ny = py / size;

      // 外圆角矩形背景（深靛夜色渐变）
      const bgDist = roundedRectSdf(px, py, center, center, half, half, radius);
      const bgCov = clamp01(0.5 - bgDist / aa);
      if (bgCov <= 0) continue;

      const t = clamp01(nx * 0.45 + ny * 0.65);
      const rBg = lerp(42, 16, t);
      const gBg = lerp(58, 22, t);
      const bBg = lerp(96, 40, t);
      let col = [rBg, gBg, bBg, bgCov];

      // 顶部柔光高光
      const glow = Math.exp(-(((nx - 0.35) ** 2 + (ny - 0.2) ** 2) / 0.16));
      col = blendOver(col, [142, 200, 255], glow * 0.26 * bgCov);

      // 内部左上角装饰页面卡片（暖金渐变）
      const cardDist = roundedRectSdf(
        px,
        py,
        center,
        center,
        size * 0.26,
        size * 0.24,
        size * 0.08,
      );
      const cardStroke = clamp01(0.5 - Math.abs(cardDist) / (size * 0.032));
      col = blendOver(col, [244, 239, 230], cardStroke * 0.28 * bgCov);

      // 中央几何“一”横杠（暖米金）
      const barDist = roundedRectSdf(
        px,
        py,
        center,
        center,
        size * 0.21,
        Math.max(1.1, size * 0.048),
        Math.max(0.8, size * 0.03),
      );
      const barCov = clamp01(0.5 - barDist / aa);
      const barColor = [lerp(248, 215, nx), lerp(236, 178, nx), lerp(214, 134, nx)];
      col = blendOver(col, barColor, barCov * bgCov);

      // 右上角星点（代表新标签页与微光）
      const dotDist = Math.hypot(px - size * 0.68, py - size * 0.33) - Math.max(0.9, size * 0.042);
      const dotCov = clamp01(0.5 - dotDist / aa);
      col = blendOver(col, [142, 200, 255], dotCov * bgCov);

      const idx = (y * size + x) * 4;
      rgba[idx] = Math.round(clamp01(col[0] / 255) * 255);
      rgba[idx + 1] = Math.round(clamp01(col[1] / 255) * 255);
      rgba[idx + 2] = Math.round(clamp01(col[2] / 255) * 255);
      rgba[idx + 3] = Math.round(clamp01(col[3]) * 255);
    }
  }
  return rgba;
}

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2a3a60" />
      <stop offset="100%" stop-color="#101628" />
    </linearGradient>
    <linearGradient id="bar" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f8ecd6" />
      <stop offset="100%" stop-color="#d7b286" />
    </linearGradient>
  </defs>
  <rect x="8" y="8" width="112" height="112" rx="30" fill="url(#bg)" />
  <rect x="30" y="33" width="68" height="62" rx="12" fill="none" stroke="#f4efe6" stroke-opacity="0.28" stroke-width="4" />
  <rect x="37" y="58" width="54" height="12" rx="6" fill="url(#bar)" />
  <circle cx="87" cy="43" r="5.5" fill="#8ec8ff" />
</svg>
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'icon.svg'), ICON_SVG, 'utf8');

for (const size of SIZES) {
  const png = encodePng(size, size, renderIconPixels(size));
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`已生成扩展图标: ${path.relative(process.cwd(), outPath)} (${png.length} bytes)`);
}
