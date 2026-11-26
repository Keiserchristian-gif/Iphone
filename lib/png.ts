const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
/** Length (0) + "IEND" + CRC: the fixed last 12 bytes of every PNG. */
const IEND_LENGTH = 12;
/** Length + type + CRC around a chunk's data. */
const CHUNK_OVERHEAD = 12;
/**
 * Lowercase first letter = decoders may skip it, lowercase second = private,
 * lowercase fourth = editors may copy it. So it never changes the picture.
 */
const FILL_TYPE = "fiLl";

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function isPng(bytes: Uint8Array): boolean {
  if (bytes.length < SIGNATURE.length + IEND_LENGTH) return false;
  if (!SIGNATURE.every((b, i) => bytes[i] === b)) return false;
  const tail = bytes.subarray(bytes.length - 8, bytes.length - 4);
  return String.fromCharCode(...tail) === "IEND";
}

/**
 * Makes a PNG file at least `minBytes` large by adding one filler chunk
 * before the end marker. The pixels stay exactly the same.
 */
export function padPng(png: Uint8Array, minBytes: number): Uint8Array {
  if (!isPng(png)) throw new Error("Not a PNG file");
  if (png.length >= minBytes) return png;

  const fillLength = Math.max(0, minBytes - png.length - CHUNK_OVERHEAD);
  const chunk = new Uint8Array(CHUNK_OVERHEAD + fillLength);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, fillLength);
  for (let i = 0; i < 4; i++) chunk[4 + i] = FILL_TYPE.charCodeAt(i);
  view.setUint32(8 + fillLength, crc32(chunk.subarray(4, 8 + fillLength)));

  const iendStart = png.length - IEND_LENGTH;
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, iendStart), 0);
  out.set(chunk, iendStart);
  out.set(png.subarray(iendStart), iendStart + chunk.length);
  return out;
}
