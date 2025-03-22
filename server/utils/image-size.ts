import probe from 'probe-image-size';
import fs from 'fs-extra';

export async function getImageSize(filePath: string) {
  const result = await probe(fs.createReadStream(filePath));
  return result;
}

export async function getImageSizeUrl(url: string) {
  const result = await probe(url);
  return result;
}
