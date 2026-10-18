import { usePopAlert } from '@composables/composables.js';

let monitorInterval = null;
let lastAlertTimestamp = 0;
let lastAlertLevel = null;
const ALERT_COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown between repeated warnings

/**
 * Requests the browser to mark this origin's storage as Persistent.
 * Persistent storage is exempt from automated browser LRU eviction when disk space is low.
 *
 * @returns {Promise<{ isPersisted: boolean, supported: boolean }>}
 */
export async function initStoragePersistence() {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return { isPersisted: false, supported: false };
  }

  try {
    let isPersisted = false;
    if (navigator.storage.persisted) {
      isPersisted = await navigator.storage.persisted();
    }

    if (!isPersisted) {
      isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.log('[StorageGuard] Storage persistence granted by browser. Auto-eviction disabled.');
      } else {
        console.warn('[StorageGuard] Storage persistence not granted yet by browser. Storage remains best-effort.');
      }
    } else {
      console.log('[StorageGuard] Storage is already persistent.');
    }

    return { isPersisted, supported: true };
  } catch (err) {
    console.warn('[StorageGuard] Failed to request storage persistence:', err);
    return { isPersisted: false, supported: true, error: err };
  }
}

/**
 * Checks storage quota, estimates remaining capacity, and triggers English toast warnings
 * if storage pressure or critical capacity is detected.
 *
 * @param {Object} options
 * @param {boolean} [options.notify=true] Whether to show UI toast notification
 * @param {boolean} [options.forceNotify=false] Bypass cooldown
 * @returns {Promise<{ healthy: boolean, availableMB: number, percentUsed: number, quotaMB: number, usageMB: number }>}
 */
export async function checkStorageQuota(options = {}) {
  const { notify = true, forceNotify = false } = options;
  const defaultResult = {
    healthy: true,
    availableMB: 0,
    percentUsed: 0,
    quotaMB: 0,
    usageMB: 0,
    isPersisted: false
  };

  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return defaultResult;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const available = Math.max(0, quota - usage);

    const quotaMB = quota / (1024 * 1024);
    const usageMB = usage / (1024 * 1024);
    const availableMB = available / (1024 * 1024);
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    let isPersisted = false;
    if (navigator.storage.persisted) {
      isPersisted = await navigator.storage.persisted();
    }

    const isCritical = availableMB < 500 || percentUsed > 92;
    const isLow = availableMB < 1500 || percentUsed > 80;
    const healthy = !isCritical && !isLow;

    if (notify && (isCritical || isLow)) {
      const now = Date.now();
      const currentLevel = isCritical ? 'critical' : 'low';
      const shouldAlert = forceNotify || 
        currentLevel !== lastAlertLevel || 
        (now - lastAlertTimestamp > ALERT_COOLDOWN_MS);

      if (shouldAlert) {
        lastAlertTimestamp = now;
        lastAlertLevel = currentLevel;

        const { showPop } = usePopAlert();

        if (isCritical) {
          const formattedAvailable = availableMB < 1024 
            ? `${Math.round(availableMB)} MB` 
            : `${(availableMB / 1024).toFixed(1)} GB`;

          showPop({
            title: 'Critical Storage Warning',
            message: `Browser disk space is critically low (${formattedAvailable} remaining). Save and export your project immediately to avoid data loss.`,
            type: 'error',
            duration: 10000
          });
        } else if (isLow) {
          showPop({
            title: 'Low Storage Warning',
            message: `Browser storage is running low (${Math.round(availableMB)} MB remaining). Consider backing up your project as a .lupisproject file.`,
            type: 'warning',
            duration: 6000
          });
        }
      }
    }

    return {
      healthy,
      isCritical,
      isLow,
      availableMB,
      percentUsed,
      quotaMB,
      usageMB,
      isPersisted
    };
  } catch (err) {
    console.warn('[StorageGuard] Failed to estimate storage:', err);
    return defaultResult;
  }
}

/**
 * Handles an unexpected quota exceeded error during project saving.
 * Triggers an English alert and executes emergency project export to disk.
 *
 * @param {string|number} projectId
 * @param {Function} exportFn
 * @param {Error} error
 */
export async function handleQuotaExceededEmergency(projectId, exportFn, error) {
  console.error('[StorageGuard] Storage quota exceeded during write:', error);
  const { showPop } = usePopAlert();

  showPop({
    title: 'Storage Quota Exceeded',
    message: 'Disk write failed because storage is full. Starting emergency project export (.lupisproject)...',
    type: 'error',
    duration: 12000
  });

  if (typeof exportFn === 'function' && projectId) {
    try {
      await exportFn(projectId);
    } catch (exportErr) {
      console.error('[StorageGuard] Emergency export also failed:', exportErr);
      showPop({
        title: 'Emergency Export Failed',
        message: 'Could not complete emergency export. Please free up space on Drive C: immediately.',
        type: 'error',
        duration: 10000
      });
    }
  }
}

/**
 * Starts periodic storage monitoring in the background.
 *
 * @param {number} [intervalMs=60000] Interval in milliseconds
 */
export function startStorageMonitor(intervalMs = 60000) {
  if (typeof window === 'undefined') return;

  stopStorageMonitor();

  // Run initial check after a brief startup delay
  setTimeout(() => {
    checkStorageQuota({ notify: true }).catch(() => {});
  }, 3000);

  monitorInterval = setInterval(() => {
    checkStorageQuota({ notify: true }).catch(() => {});
  }, intervalMs);

  if (monitorInterval?.unref) {
    monitorInterval.unref();
  }
}

/**
 * Stops background storage monitoring.
 */
export function stopStorageMonitor() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }
}
