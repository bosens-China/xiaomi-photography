import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import PDFDocument from 'pdfkit';
import dayjs from 'dayjs';
import { fileURLToPath } from 'node:url';
import { scheduler } from './utils/scheduler';
import { getImageSize, getImageSizeUrl } from './utils/image-size';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export interface Root {
  msg: string;
  code: number;
  data: Data;
  success: boolean;
  message: string;
}

export interface Data {
  cnt: number;
  pageSize: number;
  page: number;
  list: List[];
}

export interface List {
  date: string;
  picType: number;
  topics: string[];
  classes: string[];
  totalLike: number;
  actId: string;
  userName: string;
  liked: boolean;
  picUrl: string;
  width?: number;
  name: string;
  id: string;
  desc: string;
  height?: number;
}

const FONT_PATH = path.join(__dirname, './微软雅黑.ttf');

/*
 * 获取热门图片
 */
const getHotPic = async () => {
  const { data } = await axios.post<Root>(
    `https://api2.service.order.mi.com/mtop/act/image/works/list`,
    [
      {},
      {
        topic: '',
        page: 1,
        pageSize: 50,
        sort: 0,
        classes: 'imageCiTiao',
        internal: false,
        actId: '',
      },
    ],
  );
  return data.data.list;
};

/*
 * 保存网络图片到本地
 */
const savePic = async (url: string) => {
  const { data } = await axios.get(url, {
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(data, 'binary');
  const parsedUrl = new URL(url); // 使用URL对象解析URL
  const fileName = path.basename(parsedUrl.pathname); // 从pathname中获取文件名
  const dirPath = path.join(__dirname, './photo');
  const filePath = path.join(dirPath, fileName);
  await fs.outputFile(filePath, buffer as Uint8Array);
  return filePath;
};

const main = async () => {
  const doc = new PDFDocument({ autoFirstPage: false });
  doc.registerFont('MSYH', FONT_PATH);
  const date = dayjs().format('YYYY-MM-DD');
  const pdfUrl = `${date}.pdf`;
  const pdfPath = path.join(__dirname, `../public/${pdfUrl}`);

  // 确保目录存在
  await fs.ensureDir(path.dirname(pdfPath));
  doc.pipe(fs.createWriteStream(pdfPath));

  const picUrls = await getHotPic();
  // 固定为A4纸
  const maxWidth = 595;

  const filePaths = await scheduler(
    // 直接拉取指定宽度格式的图片,*2是为了图片更清晰
    picUrls.map((f) => () => savePic(f.picUrl + `?thumb=1&w=${maxWidth * 2}`)),
    {
      onChange({ executed }) {
        console.log(`当前进度：${executed}/${picUrls.length}`);
      },
    },
  );

  for (let index = 0; index < filePaths.length; index++) {
    const filePath = filePaths[index];
    const { width, height, picUrl } = picUrls[index];
    if (width && height) {
      const scale = width / maxWidth;
      const maxHeight = Math.ceil(height / scale);

      // 创建新页面并设置尺寸
      doc.addPage({
        size: [maxWidth, maxHeight],
        margin: 0,
      });
    } else {
      const result = await getImageSize(filePath);
      if (!result) {
        doc.addPage({
          size: 'a4',
          margin: 0,
        });
      } else {
        // 修订尺寸，因为有可能下载的图片依然不对
        const scale = result.width / maxWidth;
        const h = Math.ceil(result.height / scale);
        doc.addPage({
          size: [maxWidth, h],
          margin: 0,
        });
      }
      const imgResult = await getImageSizeUrl(picUrl);

      // 如果存在修正数据，后面会输出到json文件
      picUrls[index].width = imgResult.width;
      picUrls[index].height = imgResult.height;
    }

    // 添加图片（自动适应页面）
    doc.image(filePath, 0, 0, {
      fit: [doc.page.width, doc.page.height],
      align: 'center',
      valign: 'center',
    });
  }

  doc.end();
  await fs.outputJSON(
    path.join(__dirname, '../src/assets/photo.json'),
    picUrls,
    { spaces: 2 },
  );
  console.log(`完成 ${pdfPath}`);

  await fs.outputJSON(
    path.join(__dirname, '../src/assets/transplant-information.json'),
    {
      __APP_PDFURL: `${pdfUrl}`,
      __APP_DATE: dayjs().format('MM-DD'),
    },
  );
};

main();
