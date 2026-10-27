import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  initStoragePersistence, 
  checkStorageQuota, 
  handleQuotaExceededEmergency, 
  startStorageMonitor, 
  stopStorageMonitor 
} from '@/features/opfs/storageGuard.js';

// Mock usePopAlert
const mockShowPop = vi.fn();
vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({
    showPop: mockShowPop,
    closePop: vi.fn(),
    popState: { isOpen: false }
  })
}));

describe('storageGuard Unit Tests', () => {
  let originalStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    originalStorage = navigator.storage;
  });

  afterEach(() => {
    stopStorageMonitor();
    vi.useRealTimers();
    Object.defineProperty(navigator, 'storage', {
      value: originalStorage,
      configurable: true,
      writable: true
    });
  });

  describe('initStoragePersistence', () => {
    it('returns supported: false when navigator.storage is missing', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: undefined,
        configurable: true,
        writable: true
      });

      const res = await initStoragePersistence();
      expect(res.supported).toBe(false);
      expect(res.isPersisted).toBe(false);
    });

    it('returns isPersisted: true when storage is already persisted', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          persisted: vi.fn().mockResolvedValue(true),
          persist: vi.fn().mockResolvedValue(true)
        },
        configurable: true,
        writable: true
      });

      const res = await initStoragePersistence();
      expect(res.isPersisted).toBe(true);
      expect(navigator.storage.persist).not.toHaveBeenCalled();
    });

    it('calls navigator.storage.persist() when not yet persisted', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          persisted: vi.fn().mockResolvedValue(false),
          persist: vi.fn().mockResolvedValue(true)
        },
        configurable: true,
        writable: true
      });

      const res = await initStoragePersistence();
      expect(res.isPersisted).toBe(true);
      expect(navigator.storage.persist).toHaveBeenCalled();
    });
  });

  describe('checkStorageQuota', () => {
    it('returns default healthy result when navigator.storage.estimate is unavailable', async () => {
      Object.defineProperty(navigator, 'storage', {
        value: {},
        configurable: true,
        writable: true
      });

      const res = await checkStorageQuota();
      expect(res.healthy).toBe(true);
    });

    it('identifies healthy storage and does not trigger popups', async () => {
      // 100 GB quota, 10 GB usage -> 90 GB available (healthy)
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            quota: 100 * 1024 * 1024 * 1024,
            usage: 10 * 1024 * 1024 * 1024
          }),
          persisted: vi.fn().mockResolvedValue(true)
        },
        configurable: true,
        writable: true
      });

      const res = await checkStorageQuota({ notify: true });
      expect(res.healthy).toBe(true);
      expect(res.isCritical).toBe(false);
      expect(res.isLow).toBe(false);
      expect(mockShowPop).not.toHaveBeenCalled();
    });

    it('triggers Low Storage Warning toast when available space is below 1500 MB', async () => {
      // 10 GB quota, 9 GB usage -> 1000 MB available (low)
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            quota: 10 * 1024 * 1024 * 1024,
            usage: 9 * 1024 * 1024 * 1024
          }),
          persisted: vi.fn().mockResolvedValue(false)
        },
        configurable: true,
        writable: true
      });

      const res = await checkStorageQuota({ notify: true, forceNotify: true });
      expect(res.healthy).toBe(false);
      expect(res.isLow).toBe(true);
      expect(res.isCritical).toBe(false);

      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Low Storage Warning',
          type: 'warning'
        })
      );
    });

    it('triggers Critical Storage Warning toast when available space is below 500 MB', async () => {
      // 10 GB quota, 9.8 GB usage -> 200 MB available (critical)
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({
            quota: 10 * 1024 * 1024 * 1024,
            usage: 9.8 * 1024 * 1024 * 1024
          }),
          persisted: vi.fn().mockResolvedValue(false)
        },
        configurable: true,
        writable: true
      });

      const res = await checkStorageQuota({ notify: true, forceNotify: true });
      expect(res.healthy).toBe(false);
      expect(res.isCritical).toBe(true);

      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Critical Storage Warning',
          type: 'error'
        })
      );
    });
  });

  describe('handleQuotaExceededEmergency', () => {
    it('shows English emergency toast and triggers project export function', async () => {
      const mockExportFn = vi.fn().mockResolvedValue(true);
      const testError = new Error('Disk quota exceeded');
      testError.name = 'QuotaExceededError';

      await handleQuotaExceededEmergency('proj_123', mockExportFn, testError);

      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Storage Quota Exceeded',
          type: 'error'
        })
      );
      expect(mockExportFn).toHaveBeenCalledWith('proj_123');
    });

    it('handles export failure gracefully and shows failure alert', async () => {
      const mockExportFn = vi.fn().mockRejectedValue(new Error('Cannot write blob'));
      const testError = new Error('Disk quota exceeded');

      await handleQuotaExceededEmergency('proj_123', mockExportFn, testError);

      expect(mockShowPop).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Emergency Export Failed',
          type: 'error'
        })
      );
    });
  });

  describe('startStorageMonitor and stopStorageMonitor', () => {
    it('sets up periodic interval and stops cleanly', () => {
      Object.defineProperty(navigator, 'storage', {
        value: {
          estimate: vi.fn().mockResolvedValue({ quota: 1000, usage: 100 }),
          persisted: vi.fn().mockResolvedValue(true)
        },
        configurable: true,
        writable: true
      });

      startStorageMonitor(5000);
      vi.advanceTimersByTime(3500); // Trigger initial delayed check
      expect(navigator.storage.estimate).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(5000); // Trigger 1 interval tick
      expect(navigator.storage.estimate).toHaveBeenCalledTimes(2);

      stopStorageMonitor();
      vi.advanceTimersByTime(10000); // Should not tick anymore
      expect(navigator.storage.estimate).toHaveBeenCalledTimes(2);
    });
  });
});
