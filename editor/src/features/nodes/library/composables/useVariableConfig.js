import { computed } from 'vue';

export function useVariableConfig() {
  const VAR_TYPES = Object.freeze({
    STRING: 'string',
    NUMBER: 'number',
    BOOLEAN: 'boolean',
    LIST: 'list',
    MAP: 'map',
    ANY: 'any'
  });

  const VAR_COLORS = Object.freeze({
    [VAR_TYPES.STRING]: '#F48FB1',
    [VAR_TYPES.NUMBER]: '#64B5F6',
    [VAR_TYPES.BOOLEAN]: '#E57373',
    [VAR_TYPES.LIST]: '#4DD0E1',
    [VAR_TYPES.MAP]: '#FF8A65',
    [VAR_TYPES.ANY]: '#B0BEC5'
  });

  const getVarColor = (type) => {
    if (!type) return VAR_COLORS[VAR_TYPES.ANY];
    const cleanType = String(type).toLowerCase();
    return VAR_COLORS[cleanType] || VAR_COLORS[VAR_TYPES.ANY];
  };

  const typeOptions = computed(() => {
    return [
      VAR_TYPES.STRING,
      VAR_TYPES.NUMBER,
      VAR_TYPES.BOOLEAN,
      VAR_TYPES.LIST,
      VAR_TYPES.MAP
    ].map(type => ({
      value: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      color: VAR_COLORS[type]
    }));
  });

  const isCollectionType = (type) => {
    if (!type) return false;
    const t = String(type).toLowerCase();
    return t === VAR_TYPES.LIST || t === VAR_TYPES.MAP;
  };

  const getDefaultValueForType = (type) => {
    if (!type) return null;
    switch (String(type).toLowerCase()) {
      case VAR_TYPES.STRING:
        return '';
      case VAR_TYPES.NUMBER:
        return 0;
      case VAR_TYPES.BOOLEAN:
        return false;
      case VAR_TYPES.MAP:
        return {}; 
      case VAR_TYPES.LIST:
        return []; 
      default:
        return null;
    }
  };

  const createListElement = (itemType = 'string') => {
    return getDefaultValueForType(itemType);
  };

  const sanitizeVariableValue = (value, type) => {
    if (!type) return value;
    const t = String(type).toLowerCase();

    if (t === VAR_TYPES.LIST) {
      if (!Array.isArray(value)) return [];
      return value.map(item => {
        if (item && typeof item === 'object' && ('defaultValue' in item || 'value' in item)) {
          return item.defaultValue ?? item.value ?? '';
        }
        return item;
      });
    }

    if (t === VAR_TYPES.MAP) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
      const cleanMap = {};
      for (const [key, val] of Object.entries(value)) {
        if (val && typeof val === 'object' && ('defaultValue' in val || 'value' in val)) {
          cleanMap[key] = val.defaultValue ?? val.value ?? '';
        } else {
          cleanMap[key] = val;
        }
      }
      return cleanMap;
    }

    return value;
  };

  return {
    VAR_TYPES,
    VAR_COLORS,
    typeOptions,
    getVarColor,
    isCollectionType,
    getDefaultValueForType,
    createListElement,
    sanitizeVariableValue
  };
}