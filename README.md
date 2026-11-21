# 光影集

用于浏览国内摄影作品、学习构图的个人画廊。Astro 静态生成首页、周刊和作品详情，Vue 查看器提供九宫格、原始尺寸和切图。站点支持桌面、平板和手机 H5，浅色和深色模式默认跟随系统。

## 本地运行

使用 Node.js 22.12 及以上版本和项目锁定的 pnpm 10。

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm build` 校验周刊 JSON、检查类型并生成静态网页。GitHub Pages 部署路径是 `/xiaomi-photography/`。

## 发布周刊

1. 按[周刊 JSON 格式](docs/issue-json.md)在 `src/data/issues/` 新增 `YYYY-MM-DD.json`。
2. 本地运行 `pnpm build` 验证，随后提交并推送到 `main`。
3. GitHub Actions 根据仓库里的 JSON 构建并发布到 GitHub Pages。

首页展示日期最新的一期。保留在目录中的文件会继续出现在周刊切换菜单。仓库保存图片 URL、尺寸和作品信息，已展示的首期来源为[小米徕卡全球影像大赛 2026 官方获奖页](https://eu-imagery.event.mi.com/eu/xiaomiImageryawards/award-works)。

产品行为见[项目文档](docs/index.md)。

## 协议

MIT License
