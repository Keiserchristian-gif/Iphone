import { checkPassword } from "@/lib/auth";
import { enhancePhoto } from "@/lib/enhance";
import { failureFor, type FailureCode } from "@/lib/failure";
import { isAspect } from "@/lib/frame";

/** A 4K image can take over a minute to generate. */
export const maxDuration = 300;

/** Vercel accepts request bodies up to 4.5 MB. */
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const STREAM_CHUNK_BYTES = 256 * 1024;

function fail(status: number, code: FailureCode) {
  return Response.json({ error: code }, { status });
}

/**
 * Sends the bytes in pieces. Vercel caps ordinary responses at 4.5 MB,
 * streamed ones have no cap, and a 4K image is usually larger than that.
 */
function streamBytes(bytes: Uint8Array): ReadableStream<Uint8Array> {
  let offset = 0;
  return new ReadableStream({
    pull(controller) {
      if (offset >= bytes.length) return controller.close();
      controller.enqueue(bytes.subarray(offset, offset + STREAM_CHUNK_BYTES));
      offset += STREAM_CHUNK_BYTES;
    },
  });
}

/** The page percent-encodes the password so any character survives the header. */
function passwordFrom(request: Request): string | null {
  const raw = request.headers.get("x-app-password");
  if (raw === null) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const access = checkPassword(
    passwordFrom(request),
    process.env.APP_PASSWORD,
    process.env.NODE_ENV === "production",
  );
  if (access === "unconfigured") return fail(503, "no-password-set");
  if (access === "denied") return fail(401, "password");

  const mediaType = request.headers.get("content-type") ?? "";
  if (!ACCEPTED_TYPES.includes(mediaType)) return fail(415, "bad-photo");

  const aspect = request.headers.get("x-aspect-ratio");
  if (!isAspect(aspect)) return fail(400, "bad-photo");

  const photo = new Uint8Array(await request.arrayBuffer());
  if (photo.length === 0) return fail(400, "bad-photo");
  if (photo.length > MAX_UPLOAD_BYTES) return fail(413, "too-large");

  try {
    const enhanced = await enhancePhoto(photo, mediaType, aspect);
    return new Response(streamBytes(enhanced.data), {
      headers: {
        "content-type": enhanced.mediaType,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    console.error("Enhancement failed", error);
    const failure = failureFor(error);
    return fail(failure.status, failure.code);
  }
}
