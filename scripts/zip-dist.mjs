// 将构建产物 dist/ 打包为 dist-zip/yiye-newtab.zip，确保 manifest.json 位于压缩包根目录
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const manifestPath = path.join(distDir, 'manifest.json');
const outDir = path.join(root, 'dist-zip');
const outZip = path.join(outDir, 'yiye-newtab.zip');

if (!fs.existsSync(manifestPath)) {
  console.error('未找到 dist/manifest.json，请先执行 pnpm build。');
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(outZip)) {
  fs.unlinkSync(outZip);
}

execFileSync('zip', ['-rq', outZip, '.'], { cwd: distDir, stdio: 'inherit' });

const stat = fs.statSync(outZip);
console.log(`打包完成: ${path.relative(root, outZip)} (${(stat.size / 1024).toFixed(1)} KB)`);
