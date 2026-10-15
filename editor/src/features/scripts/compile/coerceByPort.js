export function coerceValueByDataType(val, dataType) {
  const type = String(dataType || 'any').toLowerCase();

  switch (type) {
    case 'number': {
      if (val === null || val === undefined || val === '') return 0;
      const num = Number(val);
      return isNaN(num) ? 0 : num;
    }
    case 'boolean': {
      if (typeof val === 'boolean') return val;
      if (val === 'true' || val === 1 || val === '1') return true;
      if (val === 'false' || val === 0 || val === '0') return false;
      return Boolean(val);
    }
    case 'string': {
      if (val === null || val === undefined) return '';
      return String(val);
    }
    case 'list': {
      if (Array.isArray(val)) return [...val];
      if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed)) return parsed;
        } catch (_) {}
      }
      return val !== null && val !== undefined && val !== '' ? [val] : [];
    }
    case 'map': {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        return { ...val };
      }
      if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
        try {
          const parsed = JSON.parse(val);
          if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
            return parsed;
          }
        } catch (_) {}
      }
      return {};
    }
    case 'any':
    default:
      return val;
  }
}

export function coercePortValue(port, val) {
  return coerceValueByDataType(val, port?.dataType);
}

export default {
  coerceValueByDataType,
  coercePortValue
};
