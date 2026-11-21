export interface Size {
  width: number;
  height: number;
}
export interface Transform {
  scale: number;
  x: number;
  y: number;
}
export const FIT: Transform = { scale: 1, x: 0, y: 0 };

// 使用实际舞台的两个维度计算完整画幅，不能仅按视口高度推断。
export function fitSize(image: Size, stage: Size): Size {
  const ratio = Math.min(
    stage.width / image.width,
    stage.height / image.height,
  );
  return { width: image.width * ratio, height: image.height * ratio };
}
export function boundTransform(
  value: Transform,
  frame: Size,
  stage: Size,
): Transform {
  const scale = Math.min(8, Math.max(1, value.scale));
  if (scale === 1) return { ...FIT };
  const limitX = Math.max(0, (frame.width * scale - stage.width) / 2);
  const limitY = Math.max(0, (frame.height * scale - stage.height) / 2);
  return {
    scale,
    x: Math.max(-limitX, Math.min(limitX, value.x)) || 0,
    y: Math.max(-limitY, Math.min(limitY, value.y)) || 0,
  };
}
// anchor 是相对舞台中心的坐标。缩放前后保持鼠标下同一图像点，再约束边缘。
export function zoomAt(
  value: Transform,
  scale: number,
  anchor: { x: number; y: number },
  frame: Size,
  stage: Size,
): Transform {
  const next = Math.min(8, Math.max(1, scale));
  const ratio = next / value.scale;
  return boundTransform(
    {
      scale: next,
      x: anchor.x - (anchor.x - value.x) * ratio,
      y: anchor.y - (anchor.y - value.y) * ratio,
    },
    frame,
    stage,
  );
}
