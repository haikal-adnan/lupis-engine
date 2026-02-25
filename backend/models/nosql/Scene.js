import mongoose from 'mongoose';

const LayerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  scriptId: { type: String, required: true },
  name: { type: String, required: true },
  
  zIndex: { type: Number, default: 0 }, 
  orderIndex: { type: Number, default: 0 },
  
  locked: { type: Boolean, default: false },
  visible: { type: Boolean, default: true }
}, { _id: false });

const EntitySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  scriptId: { type: String, required: true },
  
  type: { 
    type: String, 
    enum: ['entity', 'group', 'ui'], 
    default: 'entity',
    required: true 
  },
  
  name: { type: String, required: true },
  tag: { type: String, default: 'untagged' },
  
  zIndex: { type: Number, default: 0 }, 
  orderIndex: { type: Number, default: 0 },

  prefabId: { type: String, ref: 'Prefab', default: null },
  
  isOverridden: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  isLocked: {type: Boolean, default: false},
  
  layerId: { type: String, required: true }, 
  parentId: { type: String, default: null },
  
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const SceneSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true },
  scriptId: { type: String, required: true, default: 'unnamed_scene' },
  name: { type: String, required: true },
  
  settings: {
    backgroundColor: { type: String, default: '#222222' },

    physics: {
        gravity: { type: Number, default: 1200 },
        drag: { type: Number, default: 5 }
    },
    
    worldBounds: { 
      x1: { type: Number, default: -1920 }, 
      x2: { type: Number, default: 1920 }, 
      y1: { type: Number, default: -1080 }, 
      y2: { type: Number, default: 1080 },
      active: { type: Boolean, default: true}
    },

    showRulers: { type: Boolean, default: true }
  },
  
  layersWorld: [LayerSchema],
  layersUI: [LayerSchema],
  
  entities: [EntitySchema]
}, { 
  timestamps: true,
  _id: false 
});

const Scene = mongoose.models.Scene || mongoose.model('Scene', SceneSchema);
export default Scene;