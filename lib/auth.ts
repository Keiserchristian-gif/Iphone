import { timingSafeEqual } from "node:crypto";

export type PasswordCheck = "ok" | "denied" | "unconfigured";

/**
 * Every enhancement costs money, so the deployed app only works with a password.
 * Without one configured it runs locally, and refuses in production.
 */
export function checkPassword(
  provided: string | null,
  expected: string | undefined,
  production: boolean,
): PasswordCheck {
  if (!expected) return production ? "unconfigured" : "ok";
  if (provided === null) return "denied";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b) ? "ok" : "denied";
}
