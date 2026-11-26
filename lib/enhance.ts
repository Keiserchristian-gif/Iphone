import { generateText } from "ai";
import type { Aspect } from "./frame";
import { enhancePrompt } from "./prompt";

export const DEFAULT_MODEL = "google/gemini-nano-banana-2.1";

type EnhanceRequest = {
  model: string;
  messages: [
    {
      role: "user";
      content: [
        { type: "text"; text: string },
        { type: "file"; mediaType: string; data: Uint8Array },
      ];
    },
  ];
  providerOptions: {
    google: { imageConfig: { aspectRatio: Aspect; imageSize: "4K" } };
  };
};

type GeneratedFile = { mediaType: string; uint8Array: Uint8Array };

export type Generate = (
  request: EnhanceRequest,
) => Promise<{ files: GeneratedFile[]; text: string }>;

export type EnhancedPhoto = { data: Uint8Array; mediaType: string };

/** The model answered, but with words instead of a picture. */
export class NoImageError extends Error {
  constructor(readonly modelText: string) {
    super("The model returned no image");
    this.name = "NoImageError";
  }
}

/** Sends a photo through the image model and returns the enhanced 4K version in the same shape. */
export async function enhancePhoto(
  photo: Uint8Array,
  mediaType: string,
  aspectRatio: Aspect,
  {
    generate = generateText,
    model = process.env.AI_IMAGE_MODEL || DEFAULT_MODEL,
  }: { generate?: Generate; model?: string } = {},
): Promise<EnhancedPhoto> {
  const result = await generate({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: enhancePrompt(aspectRatio) },
          { type: "file", mediaType, data: photo },
        ],
      },
    ],
    providerOptions: {
      google: { imageConfig: { aspectRatio, imageSize: "4K" } },
    },
  });

  const image = result.files.find((f) => f.mediaType.startsWith("image/"));
  if (!image) throw new NoImageError(result.text);
  return { data: image.uint8Array, mediaType: image.mediaType };
}
