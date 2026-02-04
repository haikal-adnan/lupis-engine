import mongoose from 'mongoose';

const LayerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  scriptId: { type: String, required: true },
  name: { type: String, required: true },
  locked: { type: Boolean, default: false },
  visible: { type: Boolean, default: true }
}, { _id: false });

const EditorStateSchema = new mongoose.Schema({
    locked: { type: Boolean, default: false },
    expanded: { type: Boolean, default: false },
}, { _id: false });

const EntitySchema = new mongoose.Schema({
  _id: { type: String, required: true },
  scriptId: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['entity', 'group'], 
    default: 'entity',
    required: true 
  },
  name: { type: String, required: true },
  tag: { type: String, default: 'untagged' },
  prefabId: { type: String, ref: 'Prefab', default: null },
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  isLocked: {type: Boolean, default: false},
  layerId: { type: String, default: 'layer_root' },
  parentId: { type: String, default: null },
  _editor: { type: EditorStateSchema, default: () => ({}) },
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const SceneSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  scriptId: { type: String, required: true, default: 'unnamed_scene' },
  name: { type: String, required: true },
  version: { type: Number, default: 1 },
  settings: {
    backgroundColor: { type: String, default: '#222222' },
    tickRate: { type: Number, default: 60 },
    worldBounds: { 
      x1: { type: Number, default: -1920 }, 
      x2: { type: Number, default: 1920 }, 
      y1: { type: Number, default: -1080 }, 
      y2: { type: Number, default: 1080 },
      active: { type: Boolean, default: true}
    },
    grid: {
      width: { type: Number, default: 32 },
      height: { type: Number, default: 32 },
      color: { type: String, default: '#ffffff' },
      opacity: { type: Number, default: 0.1 },
      visible: { type: Boolean, default: true }, 
      snap: { type: Boolean, default: true }    
    },

    showRulers: { type: Boolean, default: true }
  },
  layers: [LayerSchema],
  entities: [EntitySchema]
}, { 
  timestamps: true,
  _id: false 
});

const Scene = mongoose.models.Scene || mongoose.model('Scene', SceneSchema);
export default Scene;