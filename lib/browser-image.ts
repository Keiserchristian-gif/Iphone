import {
  OUTPUT,
  aspectValue,
  containRect,
  coverCrop,
  nearestAspect,
  type Aspect,
} from "./frame";
import { padPng } from "./png";

/** "fill" crops the photo to 9:16, "fit" keeps all of it on a blurred backdrop. */
export type Mode = "fill" | "fit";

/** The saved file is never smaller than this (10 MiB, so also above 10 MB). */
export const MIN_FILE_BYTES = 10 * 1024 * 1024;

/** Stays safely under Vercel's 4.5 MB request limit. */
const MAX_UPLOAD_BYTES = 4_000_000;
/** Longest side of the photo sent to the model. */
const UPLOAD_LONG_SIDE = 2560;

type Source = HTMLImageElement | HTMLCanvasElement;

function sizeOf(source: Source) {
  return source instanceof HTMLImageElement
    ? { w: source.naturalWidth, h: source.naturalHeight }
    : { w: source.width, h: source.height };
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return { canvas, ctx };
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Encoding failed"))),
      type,
      quality,
    );
  });
}

/**
 * Decodes a photo. The image keeps its object URL as `src`;
 * call `URL.revokeObjectURL(img.src)` when it is no longer shown or drawn.
 */
export async function loadImage(blob: Blob): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = URL.createObjectURL(blob);
  try {
    await img.decode();
  } catch (error) {
    URL.revokeObjectURL(img.src);
    throw error;
  }
  return img;
}

/** True when cropping to 9:16 would cut nothing worth mentioning. */
export function isPortraitFrame(source: Source): boolean {
  const { w, h } = sizeOf(source);
  return Math.abs(w / h / (OUTPUT.width / OUTPUT.height) - 1) < 0.01;
}

/**
 * A soft, out-of-focus version of the photo that fills the frame.
 * Shrinking it to a few pixels and enlarging it in steps works in every browser.
 */
function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  source: Source,
  width: number,
  height: number,
) {
  const { w, h } = sizeOf(source);
  const crop = coverCrop(w, h, width / height);
  let step = makeCanvas(18, 32);
  step.ctx.drawImage(source, crop.sx, crop.sy, crop.sw, crop.sh, 0, 0, 18, 32);
  while (step.canvas.width * 3 < width) {
    const next = makeCanvas(step.canvas.width * 3, step.canvas.height * 3);
    next.ctx.drawImage(step.canvas, 0, 0, next.canvas.width, next.canvas.height);
    step = next;
  }
  ctx.drawImage(step.canvas, 0, 0, width, height);
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.fillRect(0, 0, width, height);
}

/** Places a photo into a 9:16 frame of the given width. */
export function compose(source: Source, mode: Mode, width: number) {
  const height = (width * OUTPUT.height) / OUTPUT.width;
  const { canvas, ctx } = makeCanvas(width, height);
  const { w, h } = sizeOf(source);

  if (mode === "fit") {
    drawBackdrop(ctx, source, canvas.width, canvas.height);
    const rect = containRect(w, h, canvas.width, canvas.height);
    ctx.drawImage(source, rect.dx, rect.dy, rect.dw, rect.dh);
  } else {
    const crop = coverCrop(w, h, canvas.width / canvas.height);
    ctx.drawImage(
      source,
      crop.sx,
      crop.sy,
      crop.sw,
      crop.sh,
      0,
      0,
      canvas.width,
      canvas.height,
    );
  }
  return canvas;
}

/** A small picture of how the photo will sit in the frame. */
export async function renderPreview(source: Source, mode: Mode): Promise<Blob> {
  return toBlob(compose(source, mode, 720), "image/jpeg", 0.85);
}

/**
 * The picture that goes to the model. "fill" sends the 9:16 crop,
 * "fit" sends the whole photo in the closest shape the model supports.
 */
export async function prepareUpload(
  source: Source,
  mode: Mode,
): Promise<{ blob: Blob; aspect: Aspect }> {
  const { w, h } = sizeOf(source);
  const aspect: Aspect = mode === "fill" ? "9:16" : nearestAspect(w, h);
  const crop = coverCrop(w, h, aspectValue(aspect));
  const scale = Math.min(1, UPLOAD_LONG_SIDE / Math.max(crop.sw, crop.sh));
  const { canvas, ctx } = makeCanvas(crop.sw * scale, crop.sh * scale);
  ctx.drawImage(
    source,
    crop.sx,
    crop.sy,
    crop.sw,
    crop.sh,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  let quality = 0.92;
  let blob = await toBlob(canvas, "image/jpeg", quality);
  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.5) {
    quality -= 0.1;
    blob = await toBlob(canvas, "image/jpeg", quality);
  }
  return { blob, aspect };
}

/**
 * Turns the model's answer into the file that gets saved:
 * exactly 2160 x 3840, lossless PNG, at least 10 MB.
 */
export async function finishImage(enhanced: Blob, mode: Mode): Promise<File> {
  const img = await loadImage(enhanced);
  try {
    const canvas = compose(img, mode, OUTPUT.width);
    const png = await toBlob(canvas, "image/png");
    const bytes = padPng(new Uint8Array(await png.arrayBuffer()), MIN_FILE_BYTES);
    const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
    return new File([bytes as BlobPart], `hochformat-${stamp}.png`, {
      type: "image/png",
    });
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
