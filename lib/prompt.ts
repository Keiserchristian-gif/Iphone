import type { Aspect } from "./frame";

/**
 * The instruction sent to the image model with every photo.
 * A 9:16 photo is the final frame; any other shape is kept as it is
 * and placed into the 9:16 frame afterwards.
 */
export function enhancePrompt(aspect: Aspect): string {
  const portrait = aspect === "9:16";
  const size = portrait
    ? "true 4K resolution (2160x3840, portrait, 9:16)"
    : `true 4K resolution, keeping its ${aspect} aspect ratio`;
  const output = portrait
    ? "ultra high-definition, clean, natural, professional 4K image in 9:16 portrait format for an Instagram post."
    : `ultra high-definition, clean, natural, professional 4K image in ${aspect} format.`;

  return `Enhance and upscale this image to ${size}.
Preserve the original composition, framing, and identity exactly - do not alter facial features, objects, or layout.
Improve overall sharpness, clarity, and fine details while maintaining a natural, realistic look.
Reduce noise, compression artifacts, blur, and pixelation.
Reconstruct missing details in a photorealistic way, especially in textures like skin, fabric, hair, and background elements.
Enhance dynamic range, correct lighting and color balance, and improve contrast without overprocessing.
Avoid artificial or "AI-looking" results - keep it true to the original image as if it were captured in high resolution.
Output: ${output}`;
}
