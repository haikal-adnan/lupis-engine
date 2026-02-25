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
  [VAR_TYPES.STRING]: '#F48FB1', 
  [VAR_TYPES.NUMBER]: '#64B5F6',   
  [VAR_TYPES.BOOLEAN]: '#E57373',  
  [VAR_TYPES.VECTOR2]: '#81C784', 
  [VAR_TYPES.VECTOR3]: '#FFB74D',   
  [VAR_TYPES.OBJECT]: '#BA68C8',    
  [VAR_TYPES.ANY]: '#E0E0E0',     
  [VAR_TYPES.EXECUTION]: '#FFFFFF' 
};

export const getVarColor = (type) => VAR_COLORS[type?.toLowerCase()] || VAR_COLORS.ANY;