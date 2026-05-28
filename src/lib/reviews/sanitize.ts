const MAX_COMMENT_LENGTH = 2000;

/** Trim and cap review comment length; strip control characters. */
export function sanitizeReviewComment(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const trimmed = raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
  if (!trimmed) return null;
  return trimmed.length > MAX_COMMENT_LENGTH ? trimmed.slice(0, MAX_COMMENT_LENGTH) : trimmed;
}
