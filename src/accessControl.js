/**
 * Access Control — multi-user permission model for Experience OS.
 *
 * Four roles: admin, owner, editor, viewer.
 * Three visibility levels: private, team, public.
 *
 * The access control module wraps GitVault to enforce:
 * - ownerId on every record (who created it)
 * - visibility on every record (who can see it)
 * - role-based permission checks (can edit, can delete, can review)
 *
 * In single-user mode (default), ownerId defaults to "system"
 * and visibility defaults to "private". All operations are allowed.
 */

export const ROLES = Object.freeze({
  ADMIN: "admin",
  OWNER: "owner",
  EDITOR: "editor",
  VIEWER: "viewer"
});

export const VISIBILITY = Object.freeze({
  PRIVATE: "private",
  TEAM: "team",
  PUBLIC: "public"
});

/**
 * Default owner ID when no user context is provided.
 * Used in single-user mode.
 */
export const DEFAULT_OWNER = "system";

/**
 * Apply ownership and visibility fields to a record before saving.
 * If the record already has ownerId/visibility, they are preserved.
 *
 * @param {Object} record - The record to annotate
 * @param {Object} [context] - User context
 * @param {string} [context.userId] - Current user ID
 * @param {string} [context.visibility] - Visibility level
 * @returns {Object} The annotated record
 */
export function applyOwnership(record, context = {}) {
  if (!record.ownerId) {
    record.ownerId = context.userId || DEFAULT_OWNER;
  }
  if (!record.visibility) {
    record.visibility = context.visibility || VISIBILITY.PRIVATE;
  }
  return record;
}

/**
 * Check if a user can read a record.
 *
 * @param {Object} record
 * @param {Object} [context] - User context
 * @param {string} [context.userId]
 * @param {string} [context.role]
 * @returns {boolean}
 */
export function canRead(record, context = {}) {
  // No user context = single-user mode = allow all
  if (!context || !context.userId) return true;

  if (context.role === ROLES.ADMIN) return true;

  // Owner can always read their own records
  if (record.ownerId === context.userId) return true;

  // Public records are readable by everyone
  if (record.visibility === VISIBILITY.PUBLIC) return true;

  // Team records are readable by team members (anyone with a userId)
  if (record.visibility === VISIBILITY.TEAM && context.userId) return true;

  // Private records: only owner
  return false;
}

/**
 * Check if a user can edit (update) a record.
 *
 * @param {Object} record
 * @param {Object} [context]
 * @returns {boolean}
 */
export function canEdit(record, context = {}) {
  // No user context = single-user mode = allow all
  if (!context || !context.userId) return true;

  if (context.role === ROLES.ADMIN) return true;

  // Owner can edit
  if (record.ownerId === context.userId) return true;

  // Editors can edit team/public records
  if (context.role === ROLES.EDITOR && record.visibility !== VISIBILITY.PRIVATE) return true;

  return false;
}

/**
 * Check if a user can delete a record.
 *
 * @param {Object} record
 * @param {Object} [context]
 * @returns {boolean}
 */
export function canDelete(record, context = {}) {
  if (!context || !context.userId) return true;
  if (context.role === ROLES.ADMIN) return true;
  if (record.ownerId === context.userId) return true;
  // Only owners can delete — editors and viewers cannot
  return false;
}

/**
 * Check if a user can review a record.
 * Review is a special case: editors can review but not delete.
 *
 * @param {Object} record
 * @param {Object} [context]
 * @returns {boolean}
 */
export function canReview(record, context = {}) {
  if (!context || !context.userId) return true;
  if (context.role === ROLES.ADMIN) return true;
  if (record.ownerId === context.userId) return true;
  if (context.role === ROLES.EDITOR) return true;
  return false;
}

/**
 * Filter a list of records by read permission.
 *
 * @param {Array} records
 * @param {Object} [context]
 * @returns {Array}
 */
export function filterReadable(records, context = {}) {
  if (!context || !context.userId) return records;
  return records.filter((r) => canRead(r, context));
}

/**
 * Create a user context from request headers.
 *
 * Canonical protocol:
 *   x-eos-identity: {"userId":"alice","role":"owner","visibility":"private"}
 *
 * The legacy x-user-id/x-user-role/x-user-visibility headers remain accepted
 * during migration. A malformed explicit identity fails closed instead of
 * becoming an unrestricted single-user request.
 *
 * @param {Object} request - HTTP request
 * @returns {Object|null}
 */
export function contextFromRequest(request) {
  const headers = request?.headers ?? {};
  const canonical = singleHeader(headers["x-eos-identity"]);
  if (canonical) {
    let parsed;
    try {
      parsed = JSON.parse(canonical);
    } catch {
      throw invalidIdentity("x-eos-identity must be valid JSON");
    }
    return normalizeIdentity(parsed);
  }

  const userId = singleHeader(headers["x-user-id"]);
  if (!userId) return null;
  return normalizeIdentity({
    userId,
    role: singleHeader(headers["x-user-role"]) || ROLES.VIEWER,
    visibility: singleHeader(headers["x-user-visibility"]) || VISIBILITY.PRIVATE
  });
}

/**
 * Local loopback mode is a trusted single-user boundary. Other deployment
 * modes require an authenticated admin for process-spawning and PII export.
 */
export function hasPrivilegedAccess(context, { localMode = false } = {}) {
  return localMode || context?.role === ROLES.ADMIN;
}

function normalizeIdentity(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw invalidIdentity("x-eos-identity must be a JSON object");
  }
  const userId = typeof value.userId === "string" ? value.userId.trim() : "";
  if (!userId) throw invalidIdentity("identity userId is required");

  const role = typeof value.role === "string" && value.role.trim()
    ? value.role.trim()
    : ROLES.VIEWER;
  if (!Object.values(ROLES).includes(role)) {
    throw invalidIdentity(`identity role is invalid: ${role}`);
  }

  const visibility = typeof value.visibility === "string" && value.visibility.trim()
    ? value.visibility.trim()
    : VISIBILITY.PRIVATE;
  if (!Object.values(VISIBILITY).includes(visibility)) {
    throw invalidIdentity(`identity visibility is invalid: ${visibility}`);
  }

  return {
    userId,
    role,
    visibility
  };
}

function singleHeader(value) {
  return Array.isArray(value) ? value[0] : value;
}

function invalidIdentity(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}
