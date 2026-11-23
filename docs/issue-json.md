# 周刊 JSON 格式

同一周以北京时间周一为期次日期，可并排展示国内版和国际版。国内版使用 `src/data/issues/YYYY-MM-DD.json`，国际版使用 `src/data/issues/YYYY-MM-DD-international.json`。国内、国际指官方来源，不按摄影师国籍拆分，允许跨版收录相同作品。两份文件的 `date` 相同；国际版必须显式标为 `edition: "international"`。首页以日期倒序排列；只有一版的期次也可浏览。

## 周刊

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `date` | 字符串，必填 | 期次日期，格式为 `YYYY-MM-DD` |
| `title` | 字符串，必填 | 本期标题 |
| `sourceUrl` | HTTPS URL，可选 | 本期官方出处或来源链接 |
| `edition` | `domestic` / `international` | 省略视为国内版 |
| `status` | `published` / `external` / `empty` | 省略视为已有的有图版 |
| `photos` | 对象数组，必填 | 有图版至少一件作品；外链版和空期填写 `[]` |
| `entries` | 对象数组，外链版必填 | 至少一件，包含原文 `name` 和 `userName`，可包含 `sourceIds`，不填写图片地址 |

- 自动同步的国内与国际版统一生成有图版，按 `photos` 的顺序展示照片和切换详情；记录从实际图片解析的尺寸，并保留作者、说明和官方出处。
- 外链版仅兼容历史或手工数据，必须提供 HTTPS `sourceUrl`，本站显示名单并链接到官方获奖页。自动同步不再生成外链版，会将可匹配的旧名单在原期次内补齐为有图版。
- 有变化的新日期可用同一提交新增国内版、国际版。某一版无新增时使用 `status: "empty"` 和空 `photos` 明示，不复制旧内容，不生成空详情页。两版都无变化时无需创建新一期。

自动同步为作品及外链名单维护 `sourceIds`：赛事年份、版本、官方配置行 ID 与原图路径指纹的组合。它不依赖作品排列位置、CDN 域名或图片处理参数；同一作品多次获奖时保留多个标识。旧记录首次同步按同届的原文标题和署名匹配并补齐标识，后续可据此更正标题和署名。

## 作品

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `sourceIds` | 字符串数组，可选 | 自动同步的来源标识；人工维护已有记录时应保留 |
| `id` | 字符串，必填 | 期内唯一。可用英文字母、数字、连字符和下划线 |
| `name` | 字符串，必填 | 作品名 |
| `userName` | 字符串，必填 | 摄影师署名 |
| `picUrl` | HTTPS URL，必填 | 原图地址 |
| `width`、`height` | 正整数，必填 | 原图实际像素宽高，用于预留画幅及原始尺寸查看 |
| `desc` | 字符串，可选 | 作品说明 |
| `variants` | 对象数组，可选 | 同一画幅的缩略图。每项提供 HTTPS `url` 和实际像素 `width` |

浏览器根据屏幕宽度和像素密度从缩略图与原图中选择。可以提供约 640px 和 960px 的缩略图覆盖常见手机屏幕，宽度很小的原图直接使用原地址即可。缩略图应保持原画幅，移动端列表的照片会按需加载。

仓库保存上述 URL 和元数据。CI 校验 JSON 并生成页面，浏览器在访问页面时从图片来源加载照片。

## 示例

```json
{
  "date": "2026-11-16",
  "title": "2026 小米徕卡全球影像大赛 · 国内",
  "sourceUrl": "https://www.mi.com/visual/award/winWorks",
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

外链版示例（文件名 `2026-11-16-international.json`；标题和署名为占位示例）：

```json
{
  "date": "2026-11-16",
  "edition": "international",
  "status": "external",
  "title": "小米影像大赛国际获奖作品",
  "sourceUrl": "https://event.mi.com/global/xiaomiImageryawards/award-works",
  "photos": [],
  "entries": [
    { "name": "官方获奖作品名", "userName": "官方摄影师署名" }
  ]
}
```
