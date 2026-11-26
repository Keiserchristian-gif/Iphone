import { describe, expect, it } from "vitest";
import {
  OUTPUT,
  aspectValue,
  containRect,
  coverCrop,
  isAspect,
  nearestAspect,
} from "./frame";

describe("OUTPUT", () => {
  it("is 4K portrait in 9:16", () => {
    expect(OUTPUT).toEqual({ width: 2160, height: 3840 });
    expect(OUTPUT.width / OUTPUT.height).toBeCloseTo(9 / 16);
  });
});

describe("coverCrop", () => {
  it("cuts equal strips off the sides of a landscape photo", () => {
    // 4032x3024 (iPhone 4:3 landscape) cropped to 9:16 keeps full height.
    expect(coverCrop(4032, 3024, 9 / 16)).toEqual({
      sx: 1165.5,
      sy: 0,
      sw: 1701,
      sh: 3024,
    });
  });

  it("cuts equal strips off top and bottom of a photo that is too tall", () => {
    expect(coverCrop(900, 3200, 9 / 16)).toEqual({
      sx: 0,
      sy: 800,
      sw: 900,
      sh: 1600,
    });
  });

  it("keeps a photo that is already 9:16 whole", () => {
    expect(coverCrop(1080, 1920, 9 / 16)).toEqual({
      sx: 0,
      sy: 0,
      sw: 1080,
      sh: 1920,
    });
  });
});

describe("containRect", () => {
  it("centers a landscape photo vertically at full width", () => {
    expect(containRect(4000, 3000, 2160, 3840)).toEqual({
      dx: 0,
      dy: 1110,
      dw: 2160,
      dh: 1620,
    });
  });

  it("centers a very tall photo horizontally at full height", () => {
    expect(containRect(1000, 4000, 2160, 3840)).toEqual({
      dx: 600,
      dy: 0,
      dw: 960,
      dh: 3840,
    });
  });
});

describe("nearestAspect", () => {
  it.each([
    [4032, 3024, "4:3"],
    [3024, 4032, "3:4"],
    [1080, 1920, "9:16"],
    [6000, 4000, "3:2"],
    [1000, 1000, "1:1"],
    [5000, 1000, "21:9"],
    [1170, 2532, "9:16"],
  ])("picks the closest supported shape for %ix%i", (w, h, expected) => {
    expect(nearestAspect(w, h)).toBe(expected);
  });
});

describe("aspectValue", () => {
  it("turns a ratio name into width divided by height", () => {
    expect(aspectValue("4:3")).toBeCloseTo(4 / 3);
    expect(aspectValue("9:16")).toBeCloseTo(0.5625);
  });
});

describe("isAspect", () => {
  it("accepts supported shapes only", () => {
    expect(isAspect("9:16")).toBe(true);
    expect(isAspect("7:5")).toBe(false);
    expect(isAspect(null)).toBe(false);
  });
});
