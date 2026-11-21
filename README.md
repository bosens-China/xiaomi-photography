# 光影集

用于浏览国内摄影作品、学习构图的个人画廊。Astro 静态生成首页、周刊和作品详情，Vue 查看器提供构图辅助线、连续缩放和平移及切图。站点支持桌面、平板和手机 H5，浅色和深色模式默认跟随系统。

## 本地运行

使用 Node.js 22.12 及以上版本和项目锁定的 pnpm 10。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm build` 校验周刊 JSON、检查类型并生成静态网页。GitHub Pages 部署路径是 `/xiaomi-photography/`。

自动部署仅使用 GitHub Pages，关闭 Vercel Git 自动部署和 CodeRabbit 自动 PR 审查。JSON 可直接提交到 `main` 并触发构建发布；Release Please 的版本发布 PR 单独管理版本号、CHANGELOG 和 GitHub Release，不是内容上线的前置条件。

## 发布周刊

1. 按[周刊 JSON 格式](docs/issue-json.md)在 `src/data/issues/` 新增 `YYYY-MM-DD.json`。
2. 本地运行 `pnpm build` 验证，随后提交并推送到 `main`。
3. GitHub Actions 根据仓库里的 JSON 构建并发布到 GitHub Pages。

首页展示日期最新的一期。保留在目录中的文件会继续出现在周刊切换菜单。仓库保存图片 URL、尺寸和作品信息，已展示的首期来源为[小米徕卡全球影像大赛 2026 官方获奖页](https://eu-imagery.event.mi.com/eu/xiaomiImageryawards/award-works)。

产品行为见[项目文档](docs/index.md)。

## 协议

MIT License

## 详情画布交互

详情直接加载 `picUrl` 原图（列表仍按响应式缩略图加载），每张作品从完整居中适配开始；缩放和平移不跨作品保存。网格与黑白偏好仍保留。

桌面鼠标/触控板在画布内捏合或 Ctrl + 滚轮连续缩放（适配倍率 1–8 倍），双击以鼠标位置放大一档，再双击复位。适配时普通滚轮滚动页面；放大后普通滚轮或鼠标拖拽平移。网格随照片一起变换。

键盘 Z 放大/复位；聚焦画布后 + / - 缩放、0 复位，放大后方向键平移，适配时左右键仍切图。移动端保留页面滚动、浏览器原生捏合和单指水平切图，不启用桌面画布缩放。打开原图链接仍可查看或另存原文件。

运行 `pnpm test` 验证适配尺寸、鼠标锚点与平移边界；`pnpm build` 执行类型检查并构建所有静态页面。
