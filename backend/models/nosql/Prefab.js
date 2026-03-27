import mongoose from 'mongoose';

const PrefabDataSchema = new mongoose.Schema({
  _id: { type: String }, 
  scriptId: { type: String, default: '' },
  type: { type: String, enum: ['entity', 'ui'], default: 'entity' },
  name: { type: String },
  tag: { type: String, default: 'untagged' },
  zIndex: { type: Number, default: 0 }, 
  orderIndex: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  prefabId: { type: String, ref: 'Prefab', default: null },
  overridden: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  visible: { type: Boolean, default: true },
  layerId: { type: String, default: 'layer_root' },
  parentId: { type: String, default: null },
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { 
  _id: false 
});

const PrefabSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true }, 
  name: { type: String, default: 'New Prefab' }, 
  type: { type: String, enum: ['world', 'ui'], default: 'world' },
  data: { type: PrefabDataSchema, default: () => ({}) },
  children: { type: [PrefabDataSchema], default: [] }
}, { 
  timestamps: true,
  _id: false 
});

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;