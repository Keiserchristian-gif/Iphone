import { describe, expect, it } from "vitest";
import { checkPassword } from "./auth";

describe("checkPassword", () => {
  it("accepts the configured password", () => {
    expect(checkPassword("geheim", "geheim", true)).toBe("ok");
  });

  it("denies a wrong password", () => {
    expect(checkPassword("falsch", "geheim", true)).toBe("denied");
  });

  it("denies a password that only shares a prefix", () => {
    expect(checkPassword("geheim1", "geheim", true)).toBe("denied");
  });

  it("denies a missing password", () => {
    expect(checkPassword(null, "geheim", true)).toBe("denied");
  });

  it("refuses to run unprotected in production", () => {
    expect(checkPassword(null, undefined, true)).toBe("unconfigured");
    expect(checkPassword("irgendwas", "", true)).toBe("unconfigured");
  });

  it("runs without a password during local development", () => {
    expect(checkPassword(null, undefined, false)).toBe("ok");
  });
});
