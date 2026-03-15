import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { EngineBridge } from "@/services/engine/EngineBridge.js";

export const animatorActions = {
  _getAnimatorClips(entityId) {
    if (!this.activeScene) return [];
    const entity = this.activeScene.entities.find(e => e._id === entityId);
    const animator = entity?.components?.SpriteAnimator;
    if (!animator || !animator.clips) return [];
    return Array.isArray(animator.clips) ? animator.clips : [];
  },

  _saveAnimatorClips(entityId, newClips) {
    const cleanClips = newClips.map(c => {
      const clean = { ...c };
      delete clean._uiChildren; 
      return clean;
    });

    this.patchComponent(entityId, 'SpriteAnimator', { clips: cleanClips });
    if (EngineBridge.patchComponent) {
      EngineBridge.patchComponent({
        entityId,
        componentName: 'SpriteAnimator',
        updates: { clips: cleanClips }
      });
    }
  },

  _cloneAnimatorNode(node) {
    const clone = JSON.parse(JSON.stringify(node));
    clone.id = `anim_${GenerateUUID().split('-')[0]}`;
    delete clone.children;
    delete clone._uiChildren;
    return clone;
  },

  animatorCreateCategory(entityId, targetId = null) {
    const clips = [...this._getAnimatorClips(entityId)];

    const newNode = { 
      id: GenerateUUID(), 
      name: 'New Category', 
      type: 'category', 
      scriptId: `clip_category_${GenerateUUID()}`, 
      assetId: null,
      parentId: null, 
      fps: 12, isLooping: true, frames: [], sources: {}, baseSize: { w: 32, h: 32 }, pivot: { x: 0.5, y: 1 },
      frameIndex: 0,
      isOpen: true
    };

    clips.push(newNode);
    this._saveAnimatorClips(entityId, clips);
  },

  animatorCreateClip(entityId, targetId = null) {
    const clips = [...this._getAnimatorClips(entityId)];

    let parentId = null;
    if (targetId) {
      const targetNode = clips.find(c => c.id === targetId);
      if (targetNode?.type === 'category') parentId = targetNode.id;
      else if (targetNode?.type === 'clip') parentId = targetNode.parentId;
    }

    const newNode = { 
      id: GenerateUUID(), 
      name: 'New_Clip', 
      type: 'clip', 
      scriptId: `clip_${GenerateUUID()}`,
      assetId: null,
      parentId: parentId,
      fps: 12, isLooping: true, frames: [], sources: {}, baseSize: { w: 32, h: 32 }, pivot: { x: 0.5, y: 1 },
      frameIndex: 0
    };

    clips.push(newNode);
    this._saveAnimatorClips(entityId, clips);
  },

  animatorDeleteNode(entityId, nodeId) {
    let clips = JSON.parse(JSON.stringify(this._getAnimatorClips(entityId)));
    const nodeIndex = clips.findIndex(c => c.id === nodeId);
    let deletedNode = null;

    if (nodeIndex !== -1) {
      deletedNode = clips[nodeIndex];
      clips.splice(nodeIndex, 1);
      
      if (deletedNode.type === 'category') {
         clips = clips.filter(c => c.parentId !== deletedNode.id);
      }
      this._saveAnimatorClips(entityId, clips);
    }
    return deletedNode;
  },

  animatorRenameNode(entityId, nodeId, newName) {
    const clips = [...this._getAnimatorClips(entityId)];
    const nodeIndex = clips.findIndex(c => c.id === nodeId);
    
    if (nodeIndex !== -1) {
      clips[nodeIndex].name = newName;
      this._saveAnimatorClips(entityId, clips);
    }
  },

  animatorGetNodeClone(entityId, nodeId) {
    const clips = this._getAnimatorClips(entityId);
    const node = clips.find(c => c.id === nodeId);
    if (!node) return null;

    let cloneBundle = { node: JSON.parse(JSON.stringify(node)), children: [] };
    if (node.type === 'category') {
       cloneBundle.children = clips.filter(c => c.parentId === node.id).map(c => JSON.parse(JSON.stringify(c)));
    }
    return cloneBundle;
  },

  animatorPasteNode(entityId, targetId, clipboardBundle) {
    const clips = JSON.parse(JSON.stringify(this._getAnimatorClips(entityId)));
    const { node, children } = clipboardBundle;
    
    const cloneNode = this._cloneAnimatorNode(node);
    
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
           const childClone = this._cloneAnimatorNode(child);
           childClone.parentId = cloneNode.id; 
           clips.push(childClone);
         });
       }
    } else {
       cloneNode.parentId = parentId;
       clips.push(cloneNode);
    }

    this._saveAnimatorClips(entityId, clips);
  }
};