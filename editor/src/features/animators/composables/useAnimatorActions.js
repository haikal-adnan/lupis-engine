// Sprite animator category, clip hierarchy, and timeline data operations.

import { useSceneStore } from '@scenes/useSceneStore.js';
import { GenerateUUID } from '@utils/utils.js';
import { engineBridge } from "@engines/engines.js";

export function useAnimatorActions() {
  const store = useSceneStore();

  const _getAnimatorClips = (entityId) => {
    if (!store.activeScene) return [];
    const entity = store.activeScene.entities.find(e => e.id === entityId);
    const animator = entity?.components?.SpriteAnimator;
    if (!animator || !animator.clips) return [];
    return Array.isArray(animator.clips) ? animator.clips : [];
  };

  // Flushes clips to SpriteAnimator component and engine bridge
  const _saveAnimatorClips = (entityId, newClips) => {
    const cleanClips = newClips.map(c => {
      const clean = { ...c };
      delete clean._uiChildren; 
      return clean;
    });

    if (store.patchComponent) {
      store.patchComponent(entityId, 'SpriteAnimator', { clips: cleanClips });
    }
    if (engineBridge.patchComponent) {
      engineBridge.patchComponent({
        entityId,
        componentName: 'SpriteAnimator',
        updates: { clips: cleanClips }
      });
    }
  };

  const _generateUniqueClipScriptId = (clips, base = 'New_Clip') => {
    let candidate = base;
    let counter = 1;
    const existing = new Set((clips || []).map(c => (c.scriptId || '').toLowerCase()));
    while (existing.has(candidate.toLowerCase())) {
      candidate = `${base}_${counter++}`;
    }
    return candidate;
  };

  const _cloneAnimatorNode = (node) => {
    const clone = JSON.parse(JSON.stringify(node));
    clone.id = `anim_${GenerateUUID().split('-')[0]}`;
    delete clone.name;
    delete clone.children;
    delete clone._uiChildren;
    return clone;
  };

  // Creates a category folder in the entity SpriteAnimator component
  const animatorCreateCategory = (entityId, targetId = null) => {
    const clips = [..._getAnimatorClips(entityId)];

    const newNode = { 
      id: GenerateUUID(), 
      type: 'category', 
      scriptId: _generateUniqueClipScriptId(clips, 'New_Category'), 
      assetId: null,
      parentId: null, 
      fps: 12, isLooping: true, frames: [], sources: {}, baseSize: { w: 32, h: 32 }, pivot: { x: 0.5, y: 1 },
      frameIndex: 0,
      isOpen: true,
      filterMode: 'pixelated',
      useSDF: false
    };

    clips.push(newNode);
    _saveAnimatorClips(entityId, clips);
  };

  // Creates an animation clip inside a category or at root
  const animatorCreateClip = (entityId, targetId = null) => {
    const clips = [..._getAnimatorClips(entityId)];

    let parentId = null;
    if (targetId) {
      const targetNode = clips.find(c => c.id === targetId);
      if (targetNode?.type === 'category') parentId = targetNode.id;
      else if (targetNode?.type === 'clip') parentId = targetNode.parentId;
    }

    const newNode = { 
      id: GenerateUUID(), 
      type: 'clip', 
      scriptId: _generateUniqueClipScriptId(clips, 'New_Clip'),
      assetId: null,
      parentId: parentId,
      fps: 12, isLooping: true, frames: [], sources: {}, baseSize: { w: 32, h: 32 }, pivot: { x: 0.5, y: 1 },
      frameIndex: 0,
      filterMode: 'pixelated',
      useSDF: false
    };

    clips.push(newNode);
    _saveAnimatorClips(entityId, clips);
  };

  // Deletes a clip or category and cascades deletion to child clips
  const animatorDeleteNode = (entityId, nodeId) => {
    let clips = JSON.parse(JSON.stringify(_getAnimatorClips(entityId)));
    const nodeIndex = clips.findIndex(c => c.id === nodeId);
    let deletedNode = null;

    if (nodeIndex !== -1) {
      deletedNode = clips[nodeIndex];
      clips.splice(nodeIndex, 1);
      
      if (deletedNode.type === 'category') {
         clips = clips.filter(c => c.parentId !== deletedNode.id);
      }
      _saveAnimatorClips(entityId, clips);
    }
    return deletedNode;
  };

  const animatorRenameNode = (entityId, nodeId, newName) => {
    const clips = [..._getAnimatorClips(entityId)];
    const nodeIndex = clips.findIndex(c => c.id === nodeId);
    
    if (nodeIndex !== -1) {
      clips[nodeIndex].scriptId = newName;
      delete clips[nodeIndex].name;
      _saveAnimatorClips(entityId, clips);
    }
  };

  // Bundles an animator node and children for copy/paste
  const animatorGetNodeClone = (entityId, nodeId) => {
    const clips = _getAnimatorClips(entityId);
    const node = clips.find(c => c.id === nodeId);
    if (!node) return null;

    let cloneBundle = { node: JSON.parse(JSON.stringify(node)), children: [] };
    if (node.type === 'category') {
       cloneBundle.children = clips.filter(c => c.parentId === node.id).map(c => JSON.parse(JSON.stringify(c)));
    }
    return cloneBundle;
  };

  // Clones and inserts an animator bundle into the SpriteAnimator component
  const animatorPasteNode = (entityId, targetId, clipboardBundle) => {
    const clips = JSON.parse(JSON.stringify(_getAnimatorClips(entityId)));
    const { node, children } = clipboardBundle;
    
    const cloneNode = _cloneAnimatorNode(node);
    
    let parentId = null;
    if (targetId) {
       const targetNode = clips.find(c => c.id === targetId);
       if (targetNode?.type === 'category') parentId = targetNode.id;
       else if (targetNode?.type === 'clip') parentId = targetNode.parentId;
    }

    if (cloneNode.type === 'category') {
       cloneNode.parentId = null; 
       clips.push(cloneNode);
       
       if (children && children.length > 0) {
         children.forEach(child => {
           const childClone = _cloneAnimatorNode(child);
           childClone.parentId = cloneNode.id; 
           clips.push(childClone);
         });
       }
    } else {
       cloneNode.parentId = parentId;
       clips.push(cloneNode);
    }

    _saveAnimatorClips(entityId, clips);
  };

  return {
    _getAnimatorClips,
    _saveAnimatorClips,
    _generateUniqueClipScriptId,
    _cloneAnimatorNode,
    animatorCreateCategory,
    animatorCreateClip,
    animatorDeleteNode,
    animatorRenameNode,
    animatorGetNodeClone,
    animatorPasteNode
  };
}
