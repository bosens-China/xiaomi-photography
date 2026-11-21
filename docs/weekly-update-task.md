# 每周云端更新任务

在 ChatGPT 的定时任务中创建。执行环境选择云端，并连接能够读取、提交本仓库文件和读取 Actions 状态的 GitHub 工具；如果当前连接只有读取能力，不能完成自动推送。

- 名称：每周同步小米获奖作品并检查部署
- 时间：每周一北京时间 08:00
- 时区：`Asia/Shanghai`（UTC+8）
- 仓库：<https://github.com/bosens-China/xiaomi-photography>
- 分支：`main`

## 启用前

1. 将当前 Astro 迁移、`src/data/issues/`、本文档和新版 `.github/workflows/deploy.yml` 提交并推送到 `main`。
2. 在仓库 Actions 中检查 `deploy` 的状态；若仍被停用，启用它。新版工作流已移除旧版每日三次的抓取计划。
3. 手动运行一次 `deploy`，确认 `build` 和 `deploy` 均成功，且 Pages 可以访问。完成后再启用云端更新任务。

## 可直接粘贴到 ChatGPT 的创建指令

```text
请创建一个在云端执行的重复任务，名称为“每周同步小米获奖作品并检查部署”，每周一北京时间 08:00（Asia/Shanghai，UTC+8）运行，从下一个周一开始。使用已连接的 GitHub 工具访问 bosens-China/xiaomi-photography 仓库的 main 分支。每次运行执行以下流程：

一、读取仓库和官方来源
1. 先读取 main 的最新提交、docs/issue-json.md、src/content.config.ts、src/data/issues/ 下的全部 JSON，以及 .github/workflows/deploy.yml。JSON 格式以仓库的当前约定为准。如果这些文件尚不存在，报告“新版画廊尚未部署”，不要自行创建应用或改写工作流。
2. 在云端抓取小米官方获奖页：https://eu-imagery.event.mi.com/eu/xiaomiImageryawards/award-works 。同时检查 https://www.mi.com/visual/award 和官方页面直接链接的新届获奖页。仅以小米官方页面及其引用的图片为来源。
3. 沿用当前画廊的范围：官方明确标记为 CN / 中国的摄影师获奖摄影作品。不要通过姓名猜国籍，不收录参赛投稿列表、宣传海报、导航图标或无完整作品信息的评委名单。

二、识别实际内容变化
4. 与所有已入库 JSON 比较，优先使用官方稳定作品标识；没有标识时，结合赛事届次、原文作者、原文作品名和原图核实是否同一作品。同一作品获得多个奖项或重复出现在网页上时只保留一条。不得仅因 CDN 域名、缩略图、查询参数或页面排版变化认定新增作品。组图沿用仓库现有的一作品一条记录方式。
5. 仅有确认的新增作品时才新增一期 src/data/issues/YYYY-MM-DD.json，日期使用本次执行的北京时间，photos 只包含新增作品。无新增作品时，不创建空期，不复制上一期，也不单独修改日期制造提交。
6. 官方更正了已入库作品的名称、作者、说明或实际原图时，更新原记录，保留原来的文件日期和作品 id，不另建重复记录。官方页面暂时缺失作品、抓取失败或元数据不全时，保留已有内容，报告待核实事项，不删除历史文件或作品。

三、生成和验证 JSON
7. 每期必须包含 date、title、photos，可包含 sourceUrl。每条照片必须有 id、name、userName、picUrl、width、height，可包含 desc 和 variants。原文标题、作者和说明忠实保留，不补写不存在的说明。
8. id 只能含英文字母、数字、连字符和下划线，同一期内唯一，已入库 id 不变。date 必须是有效的 YYYY-MM-DD，且与文件名一致。photos 至少一项。图片 URL 必须为 HTTPS；width 和 height 必须来自实际图片的正整数像素尺寸，不能把缩略图尺寸当原图尺寸。无法验证必填字段的作品不推送，并报告原因。
9. variants 非必填，只在官方提供可验证的同画幅缩略图时填写，每项为 {"url":"HTTPS地址","width":实际宽度}。不要自行拼接未经验证的图片处理参数。
10. 推送前解析所有待写 JSON，核对必填字段、日期、期内 id 唯一性、跨期作品去重和图片尺寸。如果云端有代码执行环境，使用项目要求的 Node.js 和 packageManager，运行 pnpm install --frozen-lockfile 及 pnpm build；没有代码执行环境时，明确记录“推送前仅完成 JSON 校验，完整构建由 CI 验证”，不得声称已通过构建。

四、提交、推送并检查 CI
11. 用户授权本任务在确认有内容变化且校验通过时，直接向该仓库 main 提交和推送 JSON；允许的写入路径仅为 src/data/issues/*.json，不修改应用代码、文档、工作流、依赖或仓库设置。提交信息使用 chore(content): sync Xiaomi photography YYYY-MM-DD。无变化不提交。推送前重新读取 main，避免覆盖并发修改；有冲突先重新比较和合并，不强制推送。
12. 通过已连接的 GitHub 用户或 GitHub App 写入仓库。若无写权限或缺少推送工具，保留生成的 JSON 并报告阻塞，不声称已经推送；不要索要或在任务文本中记录访问令牌。
13. 每次运行都检查 deploy 工作流是否启用及最近一次运行是否异常。没有内容变化时不额外触发构建。推送后按本次提交 SHA 查找 .github/workflows/deploy.yml 对应的运行，不能用旧运行的成功状态代替本次结果。如果未触发，明确报告原因；具备已授权的手动运行能力时，可以对 main 手动触发一次并核对实际运行的 SHA，不重复触发或重跑无关任务。
14. 跟进本次 build 和 deploy 的终态。失败时读取失败步骤和日志；只能修复由本次 JSON 引入的数据问题，应用或工作流问题只报告。等待超时或缺少 Actions 读取能力时，标为“部署未确认”，不要报告成功。成功后访问 https://bosens-china.github.io/xiaomi-photography/ ，核实新一期或更正后的内容可见；若页面仍是旧内容，记录为“线上内容待确认”。

结果报告：列出是否有变化、新增/更正作品数量、JSON 路径、提交 SHA、deploy 运行链接和最终状态，以及线上内容是否确认。只有内容发生变化、执行失败或需要我处理时才发送提醒。无变化且 CI 正常时保持安静。
```

## JSON 示例

以下是已入库作品的格式示例，供理解结构；它不是新作品，不能在首次任务中再次导入。

```json
{
  "date": "2026-11-21",
  "title": "2026 小米徕卡全球影像大赛 · 中国获奖作品",
  "sourceUrl": "https://eu-imagery.event.mi.com/eu/xiaomiImageryawards/award-works",
  "photos": [
    {
      "id": "exclusive",
      "name": "Exclusive",
      "userName": "Jiang Jihang",
      "picUrl": "https://img.youpin.mi-img.com/ferriswheel/6908f52b_f05c_4af2_9e36_10207428b1f0.jpeg?w=2373&h=3164",
      "width": 2373,
      "height": 3164,
      "variants": [
        {
          "url": "https://img.youpin.mi-img.com/ferriswheel/30f21c54_97d8_44a9_a9c7_d1dacdcfae67.jpeg?w=900&h=1200",
          "width": 900
        }
      ]
    }
  ]
}
```

字段约定见[周刊 JSON 格式](./issue-json.md)。ChatGPT 的 GitHub 连接与执行环境能力需要在创建任务时确认；任务说明本身不会授予工具权限。

## CI 检查要点

- `main` 的推送触发 `deploy`；ChatGPT 负责定时检查，GitHub Actions 负责校验、构建和 Pages 发布。
- 工作流停用时不会执行触发事件。公开仓库的定时工作流可能因 60 天无活动被停用，见[GitHub 官方说明](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)。
- 如果以后改为从 Actions 中写入 JSON，使用仓库默认 `GITHUB_TOKEN` 推送不会再触发新的 `push` 工作流；需要显式调度或调整执行方式。当前方案使用 ChatGPT 的 GitHub 连接推送，见[GitHub 触发规则](https://docs.github.com/en/actions/concepts/security/github_token#when-github_token-triggers-workflow-runs)。
