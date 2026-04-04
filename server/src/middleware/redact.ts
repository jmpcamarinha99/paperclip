const SENSITIVE_KEY_PATTERN =
  /^(password|passwd|pwd|token|secret|api[_-]?key|authorization|cookie|session[_-]?token|access[_-]?token|refresh[_-]?token|private[_-]?key|client[_-]?secret)$/i;

const REDACTED = "[REDACTED]";

/**
 * Returns a deep copy of the input with any sensitive fields replaced by "[REDACTED]".
 * Sensitive field names (case-insensitive): password, token, secret, apiKey, authorization,
 * cookie, sessionToken, accessToken, refreshToken, privateKey, clientSecret.
 */
export function redactSensitive(value: unknown, seen: WeakSet<object> = new WeakSet()): unknown {
  if (value === null || typeof value !== "object") return value;
  if (seen.has(value as object)) return "[Circular]";
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item, seen));
  }

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = REDACTED;
    } else {
      out[key] = redactSensitive(val, seen);
    }
  }
  return out;
}
