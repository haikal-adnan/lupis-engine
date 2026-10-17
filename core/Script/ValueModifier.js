/**
 * ValueModifier.js
 * Pure value modification operations for Script variables.
 * Assumes valid types pre-checked by Editor Gate 1.
 */

export function applyModifier(rawVal, modifier) {
  if (!modifier) return rawVal;

  let val = rawVal;
  const modType = modifier.type;
  const modValue = modifier.value;

  if (modType && modType !== 'none') {
    switch (modType) {
      case 'add': {
        const numVal = Number(val);
        const numMod = Number(modValue);
        if (!isNaN(numVal) && !isNaN(numMod)) {
          val = numVal + numMod;
        } else {
          val = String(val ?? '') + String(modValue ?? '');
        }
        break;
      }
      case 'subtract':
        val = Number(val) - Number(modValue);
        break;
      case 'multiply':
        val = Number(val) * Number(modValue);
        break;
      case 'divide':
        val = Number(modValue) !== 0 ? Number(val) / Number(modValue) : 0;
        break;
      case 'invert':
        val = -Number(val);
        break;
      case 'abs':
        val = Math.abs(Number(val));
        break;
      case 'not':
        val = !val;
        break;
      case 'append':
        val = String(val ?? '') + String(modValue ?? '');
        break;
      case 'prepend':
        val = String(modValue ?? '') + String(val ?? '');
        break;
      case 'uppercase':
        val = String(val ?? '').toUpperCase();
        break;
      case 'lowercase':
        val = String(val ?? '').toLowerCase();
        break;
      case 'trim':
        val = String(val ?? '').trim();
        break;
      case 'at_index':
        val = val != null ? val[modValue] : undefined;
        break;
      case 'first':
        val = val != null ? val[0] : undefined;
        break;
      case 'last':
        val = val != null ? val[val.length - 1] : undefined;
        break;
      case 'random':
        val = (val != null && val.length > 0) ? val[Math.floor(Math.random() * val.length)] : undefined;
        break;
      case 'count':
        val = val != null ? val.length : 0;
        break;
      default:
        break;
    }
  }

  const format = modifier.format || modifier.customText;
  if (format && typeof format === 'string') {
    const strVal = String(val);
    val = format
      .replace(/\{value\.upper\}/g, strVal.toUpperCase())
      .replace(/\{value\.lower\}/g, strVal.toLowerCase())
      .replace(/\{value\}/g, strVal);
  }

  return val;
}

export function applyModifiers(rawVal, modifiers) {
  if (!modifiers) return rawVal;
  if (Array.isArray(modifiers)) {
    return modifiers.reduce((acc, mod) => applyModifier(acc, mod), rawVal);
  }
  return applyModifier(rawVal, modifiers);
}

export default {
  applyModifier,
  applyModifiers
};
