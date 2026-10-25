// Invariant validation for serialized script graph payloads.

export const SCHEMA_VERSION = 3;

// Validates root structure of a serialized script graph payload
export function validatePayloadShape(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be an object' };
  }
  if (!payload.id || typeof payload.id !== 'string') {
    return { valid: false, error: 'Payload must have a string id' };
  }
  if (!Array.isArray(payload.nodes)) {
    return { valid: false, error: 'Payload.nodes must be an array' };
  }
  if (!Array.isArray(payload.edges)) {
    return { valid: false, error: 'Payload.edges must be an array' };
  }
  return { valid: true };
}
