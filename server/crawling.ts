import axios from "axios";
import fs from "fs-extra";
import path from "path";
import PDFDocument from "pdfkit";
import dayjs from "dayjs";
import { retry } from "./utils/retry";
import { fileURLToPath } from "node:url";

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

const FONT_PATH = path.join(__dirname, "./微软雅黑.ttf");

/*
 * 获取热门图片
 */
const getHotPic = async () => {
  const { data } = await axios.post<Root>(
    `https://api2.service.order.mi.com/mtop/act/image/works/list`,
    [
      {},
      {
        topic: "",
        page: 1,
        pageSize: 50,
        sort: 0,
        classes: "imageCiTiao",
        internal: false,
        actId: "",
      },
    ]
  );
  return data.data.list;
};

/*
 * 保存网络图片到本地
 */
const savePic = async (url: string) => {
  const { data } = await axios.get(url, {
    responseType: "arraybuffer",
  });
  const buffer = Buffer.from(data, "binary");
  const fileName = url.split("/").pop()!;
  const dirPath = path.join(__dirname, "../src/assets/photo");
  const filePath = path.join(dirPath, fileName);
  await fs.outputFile(filePath, buffer);
  return filePath;
};

const main = async () => {
  const doc = new PDFDocument({ autoFirstPage: false });
  doc.registerFont("MSYH", FONT_PATH);
  const date = dayjs().format("YYYY-MM-DD");
  const pdfUrl = `${date}.pdf`;
  const pdfPath = path.join(__dirname, `../public/${pdfUrl}`);

  doc.pipe(fs.createWriteStream(pdfPath));

  const picUrls = await getHotPic();

  const maxWidth = picUrls.reduce((max, { width }) => {
    return width! > max ? width! : max;
  }, 0);
  const maxHeight = picUrls.reduce((max, { height }) => {
    return height! > max ? height! : max;
  }, 0);

  for (let i = 0; i < picUrls.length; i++) {
    const picUrl = picUrls[i];

    const filePath = await retry(() => savePic(picUrl.picUrl));

    // 创建新页面并设置尺寸
    doc.addPage({
      size: [maxWidth, maxHeight + 100],
      margin: 0,
    });

    // 添加图片（自动适应页面）
    doc.image(filePath, 0, 0, {
      fit: [doc.page.width, doc.page.height],
      align: "center",
      valign: "center",
    });

    console.log(`当前进度 ${i + 1}/${picUrls.length}`);
  }

  doc.end();
  await fs.outputJSON(
    path.join(__dirname, "../src/assets/photo.json"),
    picUrls
  );
  console.log(`完成 ${pdfPath}`);

  await fs.outputJSON(
    path.join(__dirname, "../src/assets/transplant-information.json"),
    {
      __APP_PDFURL: `/${pdfUrl}`,
      __APP_DATE: dayjs().format("MM-DD"),
    }
  );
};

main();
