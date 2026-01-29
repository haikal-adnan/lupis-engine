// @/modules/variable/utils/VariableConfig.js

export const VAR_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  VECTOR2: 'vector2',
  VECTOR3: 'vector3',
  OBJECT: 'object',
  ANY: 'any',
  EXECUTION: 'execution'
};

export const VAR_COLORS = {
  [VAR_TYPES.STRING]: '#F48FB1',    // Pink
  [VAR_TYPES.NUMBER]: '#64B5F6',    // Blue
  [VAR_TYPES.BOOLEAN]: '#E57373',   // Red
  [VAR_TYPES.VECTOR2]: '#81C784',   // Green
  [VAR_TYPES.VECTOR3]: '#FFB74D',   // Orange
  [VAR_TYPES.OBJECT]: '#BA68C8',    // Purple
  [VAR_TYPES.ANY]: '#E0E0E0',       // Grey
  [VAR_TYPES.EXECUTION]: '#FFFFFF'  // White
};

export const getVarColor = (type) => VAR_COLORS[type?.toLowerCase()] || VAR_COLORS.ANY;