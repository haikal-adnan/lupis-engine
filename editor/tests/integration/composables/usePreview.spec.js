import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { usePreview } from '@composables/usePreview.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useProjectStore } from '@projects/projects.js';

// Mock engines.js prepareEngineData
vi.mock('@engines/engines.js', () => ({
  prepareEngineData: vi.fn(async () => ({
    project: { id: 'test_project_id', name: 'Test Project', settings: { ui: { width: 1280, height: 720 } } },
    scenes: [],
    assets: [],
    prefabs: [],
    scripts: []
  }))
}));

class MockBroadcastChannel {
  static instances = [];

  constructor(name) {
    this.name = name;
    this.onmessage = null;
    this.postMessage = vi.fn();
    this.close = vi.fn();
    MockBroadcastChannel.instances.push(this);
  }
}

globalThis.BroadcastChannel = MockBroadcastChannel;

describe('Integration Test: usePreview (1 Preview = 1 Project)', () => {
  let workspaceStore;
  let projectStore;
  let mockWindowOpen;

  beforeEach(() => {
    setActivePinia(createPinia());
    MockBroadcastChannel.instances = [];
    vi.clearAllMocks();

    workspaceStore = useWorkspaceStore();
    projectStore = useProjectStore();

    mockWindowOpen = vi.fn((url, name, features) => ({
      name,
      closed: false,
      focus: vi.fn(),
      close: vi.fn()
    }));
    globalThis.window.open = mockWindowOpen;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* =========================================================================
   * 1. PREVIEW IDENTIFIERS & URLS
   * ========================================================================= */
  describe('Per-Project Naming and Target Resolution', () => {
    it('generates isolated window targets and URLs per project ID', () => {
      const { getWindowName, getChannelName, getPreviewUrl } = usePreview();

      expect(getWindowName('project_alpha')).toBe('LupisPreview_project_alpha');
      expect(getChannelName('project_alpha')).toBe('lupis_engine_preview_channel_project_alpha');
      expect(getPreviewUrl('project_alpha')).toBe('/preview/index.html?projectId=project_alpha');

      expect(getWindowName('proj-beta-99.abc')).toBe('LupisPreview_proj-beta-99_abc');
      expect(getChannelName('proj-beta-99.abc')).toBe('lupis_engine_preview_channel_proj-beta-99.abc');
    });

    it('falls back to default targets when no projectId is provided', () => {
      workspaceStore.activeProjectId = null;
      projectStore.project = null;

      const { getWindowName, getChannelName, getPreviewUrl } = usePreview();

      expect(getWindowName(null)).toBe('LupisPreview_default');
      expect(getChannelName(null)).toBe('lupis_engine_preview_channel');
      expect(getPreviewUrl(null)).toBe('/preview/index.html');
    });
  });

  /* =========================================================================
   * 2. WINDOW OPENING & PREVIEW POPUP TARGETING
   * ========================================================================= */
  describe('Window Isolation Across Projects', () => {
    it('opens dedicated window with project target name and projectId query param', async () => {
      workspaceStore.activeProjectId = 'project_game_1';
      projectStore.project = {
        id: 'project_game_1',
        name: 'Game 1',
        settings: { ui: { width: 1920, height: 1080 } }
      };

      const { openOrUpdatePreview, isPreviewing } = usePreview();

      await openOrUpdatePreview();

      expect(mockWindowOpen).toHaveBeenCalledTimes(1);
      expect(mockWindowOpen).toHaveBeenCalledWith(
        '/preview/index.html?projectId=project_game_1',
        'LupisPreview_project_game_1',
        expect.stringContaining('width=1920,height=1080')
      );
      expect(isPreviewing.value).toBe(true);
    });

    it('ensures two different projects target distinct window names', async () => {
      // First project
      workspaceStore.activeProjectId = 'project_alpha';
      const preview1 = usePreview();
      await preview1.openOrUpdatePreview();
      expect(mockWindowOpen).toHaveBeenLastCalledWith(
        '/preview/index.html?projectId=project_alpha',
        'LupisPreview_project_alpha',
        expect.any(String)
      );

      // Second project
      workspaceStore.activeProjectId = 'project_beta';
      const preview2 = usePreview();
      await preview2.openOrUpdatePreview();
      expect(mockWindowOpen).toHaveBeenLastCalledWith(
        '/preview/index.html?projectId=project_beta',
        'LupisPreview_project_beta',
        expect.any(String)
      );

      expect(mockWindowOpen).toHaveBeenCalledTimes(2);
    });

    it('focuses existing window and dispatches SCENE_UPDATE on subsequent update calls', async () => {
      workspaceStore.activeProjectId = 'project_alpha';
      const fakeWindow = { closed: false, focus: vi.fn(), close: vi.fn() };
      mockWindowOpen.mockReturnValue(fakeWindow);

      const { openOrUpdatePreview } = usePreview();

      // First call opens the window
      await openOrUpdatePreview();
      expect(mockWindowOpen).toHaveBeenCalledTimes(1);

      // Second call while window is still open
      await openOrUpdatePreview();
      expect(mockWindowOpen).toHaveBeenCalledTimes(1); // did not open a new window
      expect(fakeWindow.focus).toHaveBeenCalledTimes(1);

      // Verify BroadcastChannel received SCENE_UPDATE
      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_alpha');
      expect(channel).toBeDefined();
      expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'SCENE_UPDATE',
        projectId: 'project_alpha'
      }));
    });
  });

  /* =========================================================================
   * 3. BROADCAST CHANNEL COMMUNICATION & LIFECYCLE
   * ========================================================================= */
  describe('Broadcast Channel Communication & Isolation', () => {
    it('creates project-specific broadcast channel on initialization', () => {
      workspaceStore.activeProjectId = 'project_multi_123';
      const { initChannel } = usePreview();

      initChannel();

      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_multi_123');
      expect(channel).toBeDefined();
      expect(channel.postMessage).toHaveBeenCalledWith({
        type: 'PREVIEW_PING',
        projectId: 'project_multi_123'
      });
    });

    it('responds to REQUEST_LATEST_DATA with SCENE_UPDATE payload', async () => {
      workspaceStore.activeProjectId = 'project_xyz';
      const { initChannel } = usePreview();
      initChannel();

      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_xyz');
      expect(channel).toBeDefined();

      await channel.onmessage({
        data: { type: 'REQUEST_LATEST_DATA', projectId: 'project_xyz' }
      });

      expect(channel.postMessage).toHaveBeenCalledWith(expect.objectContaining({
        type: 'SCENE_UPDATE',
        projectId: 'project_xyz',
        opfsContext: { projectId: 'project_xyz' }
      }));
    });

    it('ignores messages from a different project ID', async () => {
      workspaceStore.activeProjectId = 'project_target';
      const { initChannel } = usePreview();
      initChannel();

      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_target');
      vi.clearAllMocks();

      await channel.onmessage({
        data: { type: 'REQUEST_LATEST_DATA', projectId: 'another_project' }
      });

      expect(channel.postMessage).not.toHaveBeenCalledWith(expect.objectContaining({
        type: 'SCENE_UPDATE'
      }));
    });

    it('updates isPreviewing to true on PREVIEW_PONG or PREVIEW_READY', async () => {
      workspaceStore.activeProjectId = 'project_test';
      const { initChannel, isPreviewing } = usePreview();
      initChannel();

      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_test');

      expect(isPreviewing.value).toBe(false);

      await channel.onmessage({
        data: { type: 'PREVIEW_PONG', projectId: 'project_test' }
      });
      expect(isPreviewing.value).toBe(true);

      await channel.onmessage({
        data: { type: 'PREVIEW_READY', projectId: 'project_test' }
      });
      expect(isPreviewing.value).toBe(true);
    });

    it('updates isPreviewing to false when PREVIEW_CLOSED is received', async () => {
      workspaceStore.activeProjectId = 'project_test';
      const { initChannel, isPreviewing } = usePreview();
      initChannel();

      const channel = MockBroadcastChannel.instances.find(c => c.name === 'lupis_engine_preview_channel_project_test');

      isPreviewing.value = true;

      await channel.onmessage({
        data: { type: 'PREVIEW_CLOSED', projectId: 'project_test' }
      });
      expect(isPreviewing.value).toBe(false);
    });
  });
});
