/**
 * Shared helpers used across pipeline / review / reuse / self-iteration engines.
 * Centralizing these removes four duplicate slug()/latest() definitions that had
 * subtly diverged (one even lacked String() wrapping and crashed on non-strings).
 */

export function slug(input) {
  return String(input)
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 48);
}

/**
 * Convert a human-readable slug into the ASCII-only form required by Vault IDs.
 * Display names keep their original language; only internal file identifiers use
 * this encoding, so local workspaces with Chinese names remain bootstrappable.
 */
export function safeIdSlug(input, fallback = "item") {
  const encoded = [...slug(input)]
    .map((character) => (/[a-z0-9._-]/.test(character)
      ? character
      : `u${character.codePointAt(0).toString(16)}`))
    .join("")
    .slice(0, 180);
  return encoded || fallback;
}

/**
 * Return the most recently active `count` records. Sort key prefers updatedAt
 * (so reviewed/edited records surface first), then createdAt, then id as a
 * deterministic tiebreaker — matching the most robust of the former copies.
 */
export function latest(records, count) {
  return [...records]
    .sort((a, b) => sortKey(b).localeCompare(sortKey(a)))
    .slice(0, count);
}

function sortKey(record) {
  return String(record?.updatedAt ?? record?.createdAt ?? record?.id ?? "");
}

export function unique(values) {
  return [...new Set(values.filter(Boolean))];
}
