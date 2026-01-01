import mongoose from 'mongoose';

const TransformSchema = new mongoose.Schema({
  translate: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 } },
  width:  { type: Number, default: 100 }, 
  height: { type: Number, default: 100 },
  rotation: { type: Number, default: 0 },
  scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 } },
  
  pivot: { x: { type: Number, default: 0.5 }, y: { type: Number, default: 0.5 } },
  
  zIndex: { type: Number, default: 0 }
}, { _id: false });

const EditorStateSchema = new mongoose.Schema({
    locked: { type: Boolean, default: false },   
    expanded: { type: Boolean, default: false },  
    hiddenInList: { type: Boolean, default: false }
}, { _id: false });

const EntitySchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  
  // --- ADDED TYPE FIELD ---
  type: { 
    type: String, 
    enum: ['entity', 'group'], // Membatasi hanya 2 tipe sesuai permintaan
    default: 'entity' 
  },
  // ------------------------

  name: { type: String, required: true },
  
  tag: { type: String, default: 'untagged' },

  prefabId: { type: String, ref: 'Prefab', default: null },
  
  isActive: { type: Boolean, default: true }, 
  isVisible: { type: Boolean, default: true }, 

  opacity: { type: Number, default: 100 },

  layerId: { type: String, default: 'layer_root' },
  
  parentId: { type: String, default: null }, 
  
  _editor: { type: EditorStateSchema, default: () => ({}) },

  transform: { type: TransformSchema, default: () => ({}) },
  
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false }); 

const SceneSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  name: { type: String, required: true },
  
  version: { type: Number, default: 1 },
  
  settings: {
    backgroundColor: { type: String, default: '#222222' },
    gravity: { x: { type: Number, default: 0 }, y: { type: Number, default: 9.8 } },
    worldBounds: { x: { type: Number, default: 0 }, y: { type: Number, default: 0 }, width: { type: Number, default: 2000 }, height: { type: Number, default: 2000 } }
  },
  entities: [EntitySchema]
}, { 
  timestamps: true,
  _id: false 
});

const Scene = mongoose.models.Scene || mongoose.model('Scene', SceneSchema);
export default Scene;