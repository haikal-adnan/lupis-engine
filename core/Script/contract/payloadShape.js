export const SCHEMA_VERSION = 2;

export function checkPayloadBasic(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('[PayloadContract] Payload must be an object.');
  }
  if (!payload.id) {
    throw new Error('[PayloadContract] Payload must specify an id.');
  }
  if (!Array.isArray(payload.nodes)) {
    throw new Error('[PayloadContract] Payload.nodes must be an array.');
  }
}
