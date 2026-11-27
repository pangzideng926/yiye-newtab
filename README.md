# 一页 · 新标签页（yiye-newtab）

iTab 风格的浏览器新标签页扩展（Manifest V3），兼容 Chrome 与 Microsoft Edge。

## 功能特性

- **全屏壁纸**：内置 8 套 CSS 渐变预设，支持自定义图片 URL（仅保存于本地存储，加载失败自动回退到渐变），可调节遮罩浓度与背景模糊度。
- **中央时钟与农历**：实时大时钟、公历日期、1900–2049 年农历干支生肖（三项均可在设置中独立开关）。
- **大圆角搜索栏**：支持百度 / Google / Bing / GitHub / B 站切换，输入网址（如 `github.com`、`localhost:3000`、`192.0.2.1`）直接跳转打开。
- **iTab 风格混排网格**：彩色大圆角图标、2×2 预览文件夹、自动抓取 favicon 与域名预填、支持上传本地图标（以 data URL 存放在本地存储）。
- **拖拽与编辑模式**：支持网格排序、双图标合成文件夹、拖入/拖出文件夹、拖至左侧栏跨分组移动；支持长按或点击「编辑」进入 iOS 风格抖动删除模式。
- **右键菜单**：图标支持打开、编辑、移动到其它分组、移出文件夹、删除；空白处可快速添加网址、文件夹、小组件或打开设置。
- **桌面小组件**：
  - **天气**：默认广州，使用免 Key 的 Open-Meteo 公共接口（失败时友好提示并回退示例数据）。
  - **日历**：月历切换与今日/日程标记。
  - **待办**：增删勾选，本地持久化。
  - **便签**：本地自动保存。
  - **homedash 联动组件（家用设备 / VPS 到期 / 下载进度）**：可选接入自部署 homedash，默认每 5 分钟刷新一次。
- **多分组与备份**：默认提供「工作 / 娱乐 / 家里」三套布局，支持新建/重命名/删除分组、滚轮切换与底部圆点导航、完整布局 JSON 导入导出（带 schema 校验）及重置当前分组。

## 技术栈

- React 19 + TypeScript + Vite（ESM）
- Manifest V3（`chrome_url_overrides.newtab`）
- Vitest + Testing Library + jsdom
- ESLint（Flat Config）+ Prettier + GitHub Actions + gitleaks

## 本地开发

环境要求：Node.js `>= 22`，pnpm `11.1.1`。

```bash
# 安装依赖
pnpm install

# 启动 Vite 开发服务器（浏览器直接预览，存储自动回退到 localStorage）
pnpm dev

# 代码规范、类型、格式检查与单元测试
pnpm lint
pnpm typecheck
pnpm format:check
pnpm test

# 构建可加载的扩展目录（输出到 dist/）
pnpm build

# 将 dist/ 打包为可分发压缩包（输出到 dist-zip/yiye-newtab.zip）
pnpm zip
```

## Chrome / Edge 安装步骤

1. 在本地执行 `pnpm install && pnpm build` 生成 `dist/` 目录（或下载解压 Release 中的 `yiye-newtab.zip`）。
2. 打开浏览器的扩展管理页面：
   - **Chrome**：地址栏访问 `chrome://extensions`
   - **Edge**：地址栏访问 `edge://extensions`
3. 打开右上角（或左侧）的 **「开发者模式」** 开关。
4. 点击 **「加载已解压的扩展程序」**（Edge 为「加载解压缩的扩展」）。
5. 选择本仓库构建出的 `dist/` 目录（其中包含 `manifest.json`）。
6. 新建一个标签页即可看到「一页」新标签页。

## 壁纸说明

- 为避免在公开仓库中引入来源或版权未确认的图片文件，本扩展**不内置**任何 jpg/png 风景壁纸资源，仅内置纯 CSS 渐变预设。
- 如需使用照片壁纸，可在侧滑「设置」面板中输入自定义图片 URL（仅保存在当前浏览器本地存储，不会写入仓库）。当自定义图片加载失败时，会自动平滑回退到底层 CSS 渐变。

## 存储与权限说明

- **存储键**：`yiyepage.v2`。
- **存储介质**：
  - 在浏览器扩展环境中使用 `chrome.storage.local`；
  - 在 `pnpm dev` 普通网页预览或测试环境中自动回退到 `localStorage`，无 `chrome.*` API 时不会报错。
- **Schema 校验**：读取与导入 JSON 时均会校验版本号、分组结构与 URL 安全性（拒绝 `javascript:` 等非 HTTP/HTTPS 协议），遇到损坏数据时安全回退至默认布局。
- **最小权限声明**：`manifest.json` 仅申请 `storage` 权限及以下必要 `host_permissions`（未申请 `<all_urls>`）：
  - `https://www.google.com/s2/favicons*`（获取网站图标）
  - `https://api.open-meteo.com/*`、`https://geocoding-api.open-meteo.com/*`（获取天气与城市地理编码）

## 与 homedash 的关系及后续工作

- 设置面板中的 **homedash 服务地址** 与 **可选访问令牌（Token）** 默认留空，且仅保存在当前浏览器本地存储。
- 未配置 homedash 地址时，相关小组件（家用设备、VPS 到期、下载进度）会显示提示「在设置中配置 homedash 地址后显示」，也可在设置中开启「未配置 homedash 时隐藏相关组件」。
- 所有接口调用集中于 [`src/lib/homedash.ts`](src/lib/homedash.ts)，默认刷新周期为 **5 分钟**（不会高频轮询）。
- **后续工作（待与 homedash 服务端联调确认）**：
  1. 当前仓库未修改 homedash 服务端。若扩展向自部署 homedash 发起请求，可能受限于服务端的 **CORS 跨域响应头**（`Access-Control-Allow-Origin`）或 **鉴权会话/令牌策略**。
  2. 后续可在 homedash 侧开放对应扩展 Origin 的 CORS 并确认 `/api/devices`、`/api/vps`、`/api/downloads` 返回字段与 Bearer Token 校验方式；如需要，也可在扩展侧补充 Manifest V3 的 `optional_host_permissions` 动态授权引导。
  3. 当前请求失败时，组件会展示友好中文原因提示，并回退显示带 **「示例数据」** 标记的占位数据。

## 安全说明

- 公开仓库不包含任何真实 IP、内网域名、个人账号、密码、邮箱、访问令牌或私钥。
- 所有示例 IP 均使用 RFC 5737 文档保留网段 `192.0.2.x`，示例链接仅使用 `example.com` 或众所周知的公开网站。
- GitHub Actions 工作流（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）已集成 `gitleaks` 扫描以防误提交敏感信息。
