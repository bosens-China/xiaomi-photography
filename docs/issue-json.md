# 周刊 JSON 格式

每期使用 `src/data/issues/YYYY-MM-DD.json`。文件名与 `date` 一致，日期最大的期次显示在首页。按 `photos` 的顺序展示照片和切换详情。

## 周刊

| 字段 | 类型 | 用途 |
| --- | --- | --- |
| `date` | 字符串，必填 | 发布日期，格式为 `YYYY-MM-DD` |
| `title` | 字符串，必填 | 本期标题 |
| `sourceUrl` | HTTPS URL，可选 | 本期官方出处或来源链接 |
| `photos` | 对象数组，必填 | 至少一件作品 |

## 作品

| 字段 | 类型 | 用途 |
| --- | --- | --- |
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
