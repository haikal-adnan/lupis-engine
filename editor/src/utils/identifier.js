/**
 * Identifier Utility for Lupis Engine (Schema Contract v3)
 * Enforces:
 * - Two-Identity Contract: id (UUID) + scriptId (Semantic slug)
 * - scriptId and variable name format: ^[a-zA-Z0-9_]+$
 * - Case-insensitive uniqueness
 */

export const SCRIPT_ID_REGEX = /^[a-zA-Z0-9_]+$/;

/**
 * Validates whether an identifier contains only alphanumeric characters and underscores.
 * @param {string} val 
 * @returns {boolean}
 */
export function isValidScriptId(val) {
  return typeof val === 'string' && val.length > 0 && SCRIPT_ID_REGEX.test(val);
}

/**
 * Sanitizes any raw string into a valid scriptId:
 * Converts spaces and hyphens to underscores, removes all other invalid characters.
 * @param {string} raw
 * @param {string} fallbackVal
 * @returns {string}
 */
export function sanitizeScriptId(raw, fallbackVal = 'item') {
  if (typeof raw !== 'string') return fallbackVal;
  const sanitized = raw.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return sanitized.length > 0 ? sanitized : fallbackVal;
}

/**
 * Generates a unique scriptId within an array of items or names, case-insensitively.
 * @param {string} desired - Desired identifier name
 * @param {Array<string|object>} existing - Array of existing strings or objects
 * @param {string|Function} [keyExtractor='scriptId'] - Key on object or accessor function
 * @param {string} [excludeId=null] - Optional ID to ignore (self when editing)
 * @returns {string} Unique sanitized scriptId
 */
export function getValidUniqueScriptId(desired, existing = [], keyExtractor = 'scriptId', excludeId = null) {
  const clean = sanitizeScriptId(desired);
  
  const existingSet = new Set();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (!item) continue;
      if (excludeId && typeof item === 'object' && item.id === excludeId) continue;
      
      let val = '';
      if (typeof item === 'string') {
        val = item;
      } else if (typeof keyExtractor === 'function') {
        val = keyExtractor(item);
      } else if (typeof keyExtractor === 'string') {
        val = item[keyExtractor] ?? item.name ?? item.id ?? '';
      }
      if (val) {
        existingSet.add(String(val).toLowerCase());
      }
    }
  }

  if (!existingSet.has(clean.toLowerCase())) {
    return clean;
  }

  // Extract base name without trailing counter: e.g. "hero_1" -> "hero"
  const match = clean.match(/^(.*?)(?:_(\d+))?$/);
  const baseName = (match && match[1]) ? match[1] : clean;

  let counter = 1;
  let candidate = `${baseName}_${counter}`;
  while (existingSet.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${baseName}_${counter}`;
  }
  return candidate;
}

/**
 * Checks if a candidate scriptId/variable name already exists case-insensitively.
 * @param {string} candidate
 * @param {Array<string|object>} existing
 * @param {string|Function} [keyExtractor='scriptId']
 * @param {string} [excludeId=null]
 * @returns {boolean}
 */
export function isScriptIdDuplicate(candidate, existing = [], keyExtractor = 'scriptId', excludeId = null) {
  if (!candidate) return false;
  const target = String(candidate).trim().toLowerCase();
  if (Array.isArray(existing)) {
    for (const item of existing) {
      if (!item) continue;
      if (excludeId && typeof item === 'object' && item.id === excludeId) continue;
      
      let val = '';
      if (typeof item === 'string') {
        val = item;
      } else if (typeof keyExtractor === 'function') {
        val = keyExtractor(item);
      } else if (typeof keyExtractor === 'string') {
        val = item[keyExtractor] ?? item.name ?? '';
      }
      if (val && String(val).toLowerCase() === target) {
        return true;
      }
    }
  }
  return false;
}
