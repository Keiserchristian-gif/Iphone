import { NoImageError } from "./enhance";

/** Short codes the page turns into messages. */
export type FailureCode =
  | "password"
  | "no-password-set"
  | "bad-photo"
  | "too-large"
  | "no-image"
  | "ai-access"
  | "credits"
  | "busy"
  | "failed";

export type Failure = { status: number; code: FailureCode };

/** Turns whatever the AI call threw into a status and code for the page. */
export function failureFor(error: unknown): Failure {
  if (error instanceof NoImageError) return { status: 422, code: "no-image" };

  const statusCode =
    typeof error === "object" && error !== null && "statusCode" in error
      ? error.statusCode
      : undefined;

  switch (statusCode) {
    case 401:
    case 403:
    case 404:
      return { status: 502, code: "ai-access" };
    case 402:
      return { status: 502, code: "credits" };
    case 429:
      return { status: 503, code: "busy" };
  }

  // Without credentials the AI SDK throws an error that has a name but no status.
  const name = error instanceof Error ? error.name : "";
  if (name === "GatewayAuthenticationError" || name === "GatewayError") {
    return { status: 502, code: "ai-access" };
  }
  return { status: 502, code: "failed" };
}
