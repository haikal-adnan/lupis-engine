export const VAR_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  OBJECT: 'object',
  LIST: 'list',      
  MAP: 'map',       
  ANY: 'any',
  EXECUTION: 'execution'
};

export const VAR_COLORS = {
  [VAR_TYPES.STRING]: '#F48FB1', 
  [VAR_TYPES.NUMBER]: '#64B5F6',   
  [VAR_TYPES.BOOLEAN]: '#E57373',  
  [VAR_TYPES.OBJECT]: '#BA68C8',
  [VAR_TYPES.LIST]: '#4DD0E1',    
  [VAR_TYPES.MAP]: '#FF8A65',  
  [VAR_TYPES.ANY]: '#E0E0E0',     
  [VAR_TYPES.EXECUTION]: '#FFFFFF' 
};

export const getVarColor = (type) => VAR_COLORS[type?.toLowerCase()] || VAR_COLORS.ANY;