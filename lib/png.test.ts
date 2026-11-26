import { describe, expect, it } from "vitest";
import { crc32, padPng } from "./png";

// A valid 1x1 transparent PNG (67 bytes).
const TINY_PNG = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  ),
  (c) => c.charCodeAt(0),
);

type Chunk = { type: string; data: Uint8Array; crcOk: boolean };

/** Walks a PNG and returns its chunks, checking each stored CRC. */
function readChunks(png: Uint8Array): Chunk[] {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
  const chunks: Chunk[] = [];
  let offset = 8;
  while (offset < png.length) {
    const length = view.getUint32(offset);
    const typeAndData = png.subarray(offset + 4, offset + 8 + length);
    const type = String.fromCharCode(...typeAndData.subarray(0, 4));
    const storedCrc = view.getUint32(offset + 8 + length);
    chunks.push({
      type,
      data: typeAndData.subarray(4),
      crcOk: crc32(typeAndData) === storedCrc,
    });
    offset += 12 + length;
  }
  expect(offset).toBe(png.length);
  return chunks;
}

describe("crc32", () => {
  it("matches the standard check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });
});

describe("padPng", () => {
  it("grows a small PNG to exactly the minimum size", () => {
    expect(padPng(TINY_PNG, 5000).length).toBe(5000);
  });

  it("returns a PNG that is already large enough unchanged", () => {
    expect(padPng(TINY_PNG, TINY_PNG.length)).toBe(TINY_PNG);
  });

  it("keeps every original chunk intact and in order", () => {
    const before = readChunks(TINY_PNG);
    const after = readChunks(padPng(TINY_PNG, 5000));
    const kept = after.filter((c) => before.some((b) => b.type === c.type));
    expect(kept).toEqual(before);
  });

  it("adds one valid chunk that image decoders are allowed to skip", () => {
    const after = readChunks(padPng(TINY_PNG, 5000));
    expect(after.every((c) => c.crcOk)).toBe(true);
    expect(after.map((c) => c.type)).toEqual(["IHDR", "IDAT", "fiLl", "IEND"]);
  });

  it("still reaches the minimum when the gap is smaller than a chunk", () => {
    const padded = padPng(TINY_PNG, TINY_PNG.length + 5);
    expect(padded.length).toBeGreaterThanOrEqual(TINY_PNG.length + 5);
    expect(readChunks(padded).every((c) => c.crcOk)).toBe(true);
  });

  it("rejects data that is not a PNG", () => {
    expect(() => padPng(new Uint8Array(100), 5000)).toThrow(/PNG/);
  });
});
