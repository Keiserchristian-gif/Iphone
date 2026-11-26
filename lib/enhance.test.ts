import { describe, expect, it } from "vitest";
import { NoImageError, enhancePhoto, type Generate } from "./enhance";
import { enhancePrompt } from "./prompt";

const photo = new Uint8Array([1, 2, 3]);
const enhanced = new Uint8Array([9, 9, 9, 9]);

/** A stand-in for the AI call that records what it was asked. */
function fakeModel(files: { mediaType: string; uint8Array: Uint8Array }[]) {
  const calls: Parameters<Generate>[0][] = [];
  const generate: Generate = async (request) => {
    calls.push(request);
    return { files, text: "" };
  };
  return { calls, generate };
}

describe("enhancePhoto", () => {
  it("returns the image the model produced", async () => {
    const { generate } = fakeModel([
      { mediaType: "image/png", uint8Array: enhanced },
    ]);
    await expect(
      enhancePhoto(photo, "image/jpeg", "9:16", { generate, model: "test/model" }),
    ).resolves.toEqual({ data: enhanced, mediaType: "image/png" });
  });

  it("sends the photo together with the enhancement prompt", async () => {
    const { calls, generate } = fakeModel([
      { mediaType: "image/png", uint8Array: enhanced },
    ]);
    await enhancePhoto(photo, "image/jpeg", "9:16", { generate, model: "test/model" });
    expect(calls[0].model).toBe("test/model");
    expect(calls[0].messages).toEqual([
      {
        role: "user",
        content: [
          { type: "text", text: enhancePrompt("9:16") },
          { type: "file", mediaType: "image/jpeg", data: photo },
        ],
      },
    ]);
  });

  it("asks for a 4K image in the requested shape", async () => {
    const { calls, generate } = fakeModel([
      { mediaType: "image/png", uint8Array: enhanced },
    ]);
    await enhancePhoto(photo, "image/jpeg", "4:3", { generate, model: "test/model" });
    expect(calls[0].providerOptions.google.imageConfig).toEqual({
      aspectRatio: "4:3",
      imageSize: "4K",
    });
  });

  it("skips non-image files in the answer", async () => {
    const { generate } = fakeModel([
      { mediaType: "text/plain", uint8Array: new Uint8Array([0]) },
      { mediaType: "image/jpeg", uint8Array: enhanced },
    ]);
    const result = await enhancePhoto(photo, "image/jpeg", "9:16", {
      generate,
      model: "test/model",
    });
    expect(result.mediaType).toBe("image/jpeg");
  });

  it("fails clearly when the model answers without an image", async () => {
    const { generate } = fakeModel([]);
    await expect(
      enhancePhoto(photo, "image/jpeg", "9:16", { generate, model: "test/model" }),
    ).rejects.toBeInstanceOf(NoImageError);
  });
});

describe("enhancePrompt", () => {
  it("names the portrait 4K size instead of the landscape one", () => {
    expect(enhancePrompt("9:16")).toContain("2160x3840");
    expect(enhancePrompt("9:16")).not.toContain("3840x2160");
  });

  it("keeps the photo's own shape when it is not 9:16", () => {
    expect(enhancePrompt("4:3")).toContain("4:3");
    expect(enhancePrompt("4:3")).not.toContain("9:16");
    expect(enhancePrompt("4:3")).not.toContain("2160x3840");
  });

  it("always forbids changing faces, objects and layout", () => {
    for (const aspect of ["9:16", "4:3"] as const) {
      expect(enhancePrompt(aspect)).toContain(
        "do not alter facial features, objects, or layout",
      );
    }
  });
});
