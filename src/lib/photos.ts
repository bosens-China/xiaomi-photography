import type { Issue } from './issues';

export type Photo = Issue['photos'][number];
export type GridMode = 'none' | 'thirds' | 'golden' | 'diagonal';

export function imageSources(photo: Photo, original = false) {
  if (original || !photo.variants?.length) return { src: photo.picUrl };

  const sources = new Map(photo.variants.map(({ width, url }) => [width, url]));
  sources.set(photo.width, photo.picUrl);
  const sorted = [...sources].sort(([a], [b]) => a - b);
  return {
    src: sorted[0][1],
    srcset: sorted.map(([width, url]) => `${url} ${width}w`).join(', '),
  };
}

const KNOWN_RATIOS: Array<{ label: string; value: number }> = [
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
  { label: '5:4', value: 5 / 4 },
  { label: '4:5', value: 4 / 5 },
  { label: '21:9', value: 21 / 9 },
];

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function formatPhotoSpecs(width: number, height: number) {
  const ratio = width / height;
  const orientation =
    Math.abs(ratio - 1) <= 0.03
      ? '方画幅'
      : ratio > 1
        ? '横画幅'
        : '竖画幅';

  let ratioLabel = '';
  let minDiff = Infinity;
  for (const candidate of KNOWN_RATIOS) {
    const diff = Math.abs(ratio - candidate.value) / candidate.value;
    if (diff < minDiff) {
      minDiff = diff;
      ratioLabel = candidate.label;
    }
  }

  if (minDiff > 0.035) {
    const divisor = gcd(width, height);
    const rw = Math.round(width / divisor);
    const rh = Math.round(height / divisor);
    if (rw <= 24 && rh <= 24) {
      ratioLabel = `${rw}:${rh}`;
    } else {
      ratioLabel = ratio >= 1 ? `${ratio.toFixed(2)}:1` : `1:${(1 / ratio).toFixed(2)}`;
    }
  }

  const mp = (width * height) / 1_000_000;
  const megapixels = mp >= 10 ? `${mp.toFixed(1)} MP` : `${mp.toFixed(2)} MP`;

  return {
    ratioLabel,
    orientation,
    megapixels,
    dimensions: `${width} × ${height}`,
  };
}
