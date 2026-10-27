export const SCRIPT_ID_REGEX = /^[a-zA-Z0-9_]+$/;

export function isValidScriptId(val) {
  return typeof val === 'string' && val.length > 0 && SCRIPT_ID_REGEX.test(val);
}

// Sanitizes a string into alphanumeric and underscore characters
export function sanitizeScriptId(raw, fallbackVal = 'item') {
  if (typeof raw !== 'string') return fallbackVal;
  const sanitized = raw.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  return sanitized.length > 0 ? sanitized : fallbackVal;
}

// Generates a unique script identifier by appending an incremental numeric suffix if needed
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
