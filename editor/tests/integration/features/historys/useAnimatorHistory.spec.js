import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAnimatorHistory, useHistory } from '@historys/historys.js';
import { useSceneStore } from '@scenes/scenes.js';
import { useAnimatorActions } from '@animators/animators.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { setupMockSceneEnvironment, createMockEntity } from '@tests/tests.js';

// Mock dependencies external di luar batas pengujian integrasi
vi.mock('@engines/engines.js', () => ({
  engineBridge: {
    patchComponent: vi.fn(),
    updateEntityProp: vi.fn(),
    moveEntity: vi.fn(),
    createEntity: vi.fn(),
    deleteEntity: vi.fn(),
    selectEntity: vi.fn(),
    clearSelection: vi.fn()
  }
}));

vi.mock('@composables/composables.js', () => ({
  usePopAlert: () => ({ showPop: vi.fn() }),
  useConfirm: () => ({ confirm: vi.fn().mockResolvedValue(true) })
}));

describe('useAnimatorHistory Integration', () => {
  let sceneStore;
  let workspaceStore;
  let animatorHistory;
  let entityId;
  let clipId;
  let animatorActions;

  beforeEach(() => {
    // Inisialisasi Pinia instans baru untuk isolasi test
    setActivePinia(createPinia());

    sceneStore = useSceneStore();
    workspaceStore = useWorkspaceStore();
    animatorActions = useAnimatorActions();

    // Setup active tab di workspace agar history key dapat dibuat (`scene_${sceneId}`)
    const { scene } = setupMockSceneEnvironment();
    workspaceStore.tabs = [{ id: 'tab_scene_1', type: 'scene', sceneId: scene.id }];

    // Buat entitas dengan komponen SpriteAnimator
    entityId = 'ent_animator_1';
    clipId = 'clip_idle_1';

    const animatorEntity = createMockEntity({
      id: entityId,
      name: 'Animated Character',
      entityType: 'sprite',
      attachComponents: {
        SpriteAnimator: {
          currentClip: clipId,
          active: true,
          isPlaying: true,
          clips: [
            {
              id: clipId,
              name: 'Idle',
              type: 'clip',
              fps: 12,
              isLooping: true,
              baseSize: { w: 32, h: 32 },
              frames: [{ id: 'f1', duration: 100 }],
              sources: { texture: 'idle_sheet.png' }
            }
          ]
        }
      }
    });

    scene.entities.push(animatorEntity);
    animatorHistory = useAnimatorHistory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Clip Property Changes Recording and Undo/Redo', () => {
    it('records clip property changes and restores original state upon undo, then reapplies on redo', () => {
      // Arrange
      const oldFps = 12;
      const newFps = 24;

      // Act: Catat perubahan properti fps dari 12 ke 24, lalu update state di store
      animatorHistory.recordClipPropChange(entityId, clipId, 'fps', oldFps, newFps);

      const clips = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips;
      clips[0].fps = newFps;
      animatorActions._saveAnimatorClips(entityId, clips);

      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].fps).toBe(24);

      // Act & Assert: Perform Undo
      animatorHistory.undo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].fps).toBe(12);

      // Act & Assert: Perform Redo
      animatorHistory.redo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].fps).toBe(24);
    });

    it('handles nested property path updates on a clip through undo and redo', () => {
      // Arrange
      const propPath = 'baseSize.w';
      const oldWidth = 32;
      const newWidth = 64;

      // Act
      animatorHistory.recordClipPropChange(entityId, clipId, propPath, oldWidth, newWidth);

      const clips = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips;
      clips[0].baseSize = { w: newWidth, h: 32 };
      animatorActions._saveAnimatorClips(entityId, clips);

      // Assert Undo
      animatorHistory.undo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].baseSize.w).toBe(32);

      // Assert Redo
      animatorHistory.redo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].baseSize.w).toBe(64);
    });

    it('[Bad Path] ignores property recording if old and new values are identical', () => {
      // Arrange
      const currentValue = 12;

      // Act
      animatorHistory.recordClipPropChange(entityId, clipId, 'fps', currentValue, currentValue);

      // Assert: Stack undo/redo harus tidak bertambah setelah operasi dipanggil
      const initialClipsState = JSON.stringify(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips);
      animatorHistory.undo();
      const afterUndoState = JSON.stringify(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips);

      expect(initialClipsState).toBe(afterUndoState);
    });
  });

  describe('Clip Frames & Sources Changes Integration', () => {
    it('records frames modification and syncs store state on undo and redo', () => {
      // Arrange
      const oldFrames = [{ id: 'f1', duration: 100 }];
      const newFrames = [{ id: 'f1', duration: 100 }, { id: 'f2', duration: 100 }];

      // Act
      animatorHistory.recordFramesChange(entityId, clipId, 'Add frame 2', oldFrames, newFrames);

      // Simulate UI component state mutation
      const clips = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips;
      clips[0].frames = newFrames;
      animatorActions._saveAnimatorClips(entityId, clips);

      // Assert Undo
      animatorHistory.undo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].frames).toHaveLength(1);

      // Assert Redo
      animatorHistory.redo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].frames).toHaveLength(2);
    });

    it('records sources dictionary changes and reverts back cleanly on undo', () => {
      // Arrange
      const oldSources = { texture: 'idle_sheet.png' };
      const newSources = { texture: 'idle_sheet_v2.png', normalMap: 'idle_normal.png' };

      // Act
      animatorHistory.recordSourcesChange(entityId, clipId, 'Update Sources', oldSources, newSources);

      const clips = sceneStore.activeScene.entities[0].components.SpriteAnimator.clips;
      clips[0].sources = newSources;
      animatorActions._saveAnimatorClips(entityId, clips);

      // Assert Undo
      animatorHistory.undo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].sources).toEqual(oldSources);

      // Assert Redo
      animatorHistory.redo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].sources).toEqual(newSources);
    });
  });

  describe('Clips Tree Hierarchy Changes', () => {
    it('records structural clip additions and removals across the animator hierarchy', () => {
      // Arrange
      const oldTree = [
        { id: 'clip_idle_1', name: 'Idle', type: 'clip' }
      ];
      const newTree = [
        { id: 'clip_idle_1', name: 'Idle', type: 'clip' },
        { id: 'clip_run_1', name: 'Run', type: 'clip' }
      ];

      // Act
      animatorHistory.recordClipsTreeChange(entityId, 'Add Run Clip', oldTree, newTree);
      animatorActions._saveAnimatorClips(entityId, newTree);

      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips).toHaveLength(2);

      // Assert Undo
      animatorHistory.undo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips).toHaveLength(1);
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[0].id).toBe('clip_idle_1');

      // Assert Redo
      animatorHistory.redo();
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips).toHaveLength(2);
      expect(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips[1].id).toBe('clip_run_1');
    });

    it('[Bad Path] rejects recording clips tree changes when entity ID is missing or invalid', () => {
      // Arrange
      const oldTree = [];
      const newTree = [{ id: 'c1', name: 'Walk' }];

      // Act
      animatorHistory.recordClipsTreeChange(null, 'Invalid Entity Test', oldTree, newTree);

      // Assert
      const initialClipsState = JSON.stringify(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips);
      animatorHistory.undo();
      const afterUndoState = JSON.stringify(sceneStore.activeScene.entities[0].components.SpriteAnimator.clips);

      expect(initialClipsState).toBe(afterUndoState);
    });
  });
});