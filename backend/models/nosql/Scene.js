import mongoose from 'mongoose';

const TransformSchema = new mongoose.Schema({
  translate: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  width:  { type: Number, default: 100 }, 
  height: { type: Number, default: 100 },
  rotation: { type: Number, default: 0 },
  scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 } },
  zIndex: { type: Number, default: 0 }
}, { _id: false });

const EntitySchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  
  name: { type: String, required: true },
  prefabId: { type: String, ref: 'Prefab', default: null },
  
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  layerId: { type: String, default: 'default' },
  parentId: { type: String, default: null }, 
  
  transform: { type: TransformSchema, default: () => ({}) },
  
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false }); 

const SceneSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  name: { type: String, required: true },
  
  version: { type: Number, default: 1 },
  
  settings: {
    backgroundColor: { type: String, default: '#000000' },
    gravity: { x: { type: Number, default: 0 }, y: { type: Number, default: 9.8 } },
    worldBounds: { x: Number, y: Number, width: Number, height: Number }
  },
  entities: [EntitySchema]
}, { 
  timestamps: true,
  _id: false 
});

const Scene = mongoose.models.Scene || mongoose.model('Scene', SceneSchema);
export default Scene;