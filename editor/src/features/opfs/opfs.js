export { useOPFSActions } from '@opfs/useOPFSActions.js'
export { useOPFSStore } from '@opfs/useOPFSStore.js'
export { opfsSchema, opfsItemSchema, getFileTypeByExtension } from '@opfs/opfsSchema.js'
export { 
  initStoragePersistence, 
  checkStorageQuota, 
  startStorageMonitor, 
  stopStorageMonitor, 
  handleQuotaExceededEmergency 
} from '@opfs/storageGuard.js'

export { default as OPFSPanel } from '@opfs/layouts/OPFSPanel.vue'