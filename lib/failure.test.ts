import { describe, expect, it } from "vitest";
import { NoImageError } from "./enhance";
import { failureFor } from "./failure";

/** Mimics errors from the AI service, which carry an HTTP status. */
function serviceError(statusCode: number) {
  return Object.assign(new Error("upstream"), { statusCode });
}

describe("failureFor", () => {
  it("reports a model answer without an image", () => {
    expect(failureFor(new NoImageError("I can't do that"))).toEqual({
      status: 422,
      code: "no-image",
    });
  });

  it("reports missing AI access as a setup problem", () => {
    expect(failureFor(serviceError(401)).code).toBe("ai-access");
    expect(failureFor(serviceError(403)).code).toBe("ai-access");
  });

  it("reports the SDK's unauthenticated error, which has no status", () => {
    // What the AI SDK throws in production and in development respectively.
    for (const name of ["GatewayError", "GatewayAuthenticationError"]) {
      const error = Object.assign(new Error("Unauthenticated."), { name });
      expect(failureFor(error)).toEqual({ status: 502, code: "ai-access" });
    }
  });

  it("reports used-up credit", () => {
    expect(failureFor(serviceError(402)).code).toBe("credits");
  });

  it("reports rate limiting as busy", () => {
    expect(failureFor(serviceError(429))).toEqual({ status: 503, code: "busy" });
  });

  it("reports an unknown model as a setup problem", () => {
    expect(failureFor(serviceError(404)).code).toBe("ai-access");
  });

  it("reports anything else as a generic failure", () => {
    expect(failureFor(new Error("boom"))).toEqual({ status: 502, code: "failed" });
    expect(failureFor("weird")).toEqual({ status: 502, code: "failed" });
  });
});
