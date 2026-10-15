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
      case 'add':
        val = val + modValue;
        break;
      case 'subtract':
        val = val - modValue;
        break;
      case 'multiply':
        val = val * modValue;
        break;
      case 'divide':
        val = modValue !== 0 ? val / modValue : 0;
        break;
      case 'invert':
        val = -val;
        break;
      case 'abs':
        val = Math.abs(val);
        break;
      case 'not':
        val = !val;
        break;
      case 'at_index':
        val = val[modValue];
        break;
      case 'first':
        val = val[0];
        break;
      case 'last':
        val = val[val.length - 1];
        break;
      case 'random':
        val = val[Math.floor(Math.random() * val.length)];
        break;
      case 'count':
        val = val.length;
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
