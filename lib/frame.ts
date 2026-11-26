/** Final image size: 4K portrait, 9:16, as Instagram stories and reels use it. */
export const OUTPUT = { width: 2160, height: 3840 } as const;

export type Crop = { sx: number; sy: number; sw: number; sh: number };
export type Rect = { dx: number; dy: number; dw: number; dh: number };

/** The centered part of a source image that fills a frame of the given aspect (width / height). */
export function coverCrop(srcW: number, srcH: number, aspect: number): Crop {
  if (srcW / srcH > aspect) {
    const sw = srcH * aspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / aspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

/** Where a whole source image sits, centered, inside a destination frame. */
export function containRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): Rect {
  const scale = Math.min(dstW / srcW, dstH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh };
}

/** Image shapes the model can produce. */
export const ASPECTS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
] as const;

export type Aspect = (typeof ASPECTS)[number];

export function isAspect(value: unknown): value is Aspect {
  return ASPECTS.includes(value as Aspect);
}

/** Width divided by height. */
export function aspectValue(aspect: Aspect): number {
  const [w, h] = aspect.split(":").map(Number);
  return w / h;
}

/** The supported shape closest to a photo, so as little as possible is cut off. */
export function nearestAspect(width: number, height: number): Aspect {
  const target = Math.log(width / height);
  return ASPECTS.reduce((best, candidate) =>
    Math.abs(Math.log(aspectValue(candidate)) - target) <
    Math.abs(Math.log(aspectValue(best)) - target)
      ? candidate
      : best,
  );
}
