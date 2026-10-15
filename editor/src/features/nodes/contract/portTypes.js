export const PORT_DATA_TYPES = Object.freeze([
  'execution',
  'string',
  'number',
  'boolean',
  'any',
  'list',
  'map'
]);

export const PORT_COLORS = Object.freeze({
  execution: '#FFFFFF',
  string: '#F48FB1',
  number: '#64B5F6',
  boolean: '#E57373',
  any: '#B0BEC5',
  list: '#4DD0E1',
  map: '#FF8A65'
});

export function getPortColor(dataType) {
  const norm = String(dataType || 'any').toLowerCase();
  return PORT_COLORS[norm] || PORT_COLORS.any;
}

export function isTypeCompatible(sourceType, targetType) {
  const s = String(sourceType || 'any').toLowerCase();
  const t = String(targetType || 'any').toLowerCase();

  if (s === 'execution' || t === 'execution') {
    return s === 'execution' && t === 'execution';
  }

  if (s === 'any' || t === 'any') {
    return true;
  }

  return s === t;
}
