import mongoose from 'mongoose';

const EditorStateSchema = new mongoose.Schema({
  locked: { type: Boolean, default: false },
  expanded: { type: Boolean, default: false },
}, { _id: false });

const PrefabDataSchema = new mongoose.Schema({
  scriptId: { type: String, default: '' },
  type: { type: String, enum: ['entity', 'group'], default: 'entity' },
  name: { type: String },
  tag: { type: String, default: 'untagged' },
  zIndex: { type: Number, default: 0 }, 
  orderIndex: { type: Number, default: 0 },
  isLocked: { type: Boolean, default: false },
  prefabId: { type: String, ref: 'Prefab', default: null },
  isOverridden: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isVisible: { type: Boolean, default: true },
  layerId: { type: String, default: 'layer_root' },
  parentId: { type: String, default: null },
  _editor: { type: EditorStateSchema, default: () => ({}) },
  components: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false });

const PrefabSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  name: { type: String, required: true },
  data: { type: PrefabDataSchema, default: () => ({}) }
}, { 
  timestamps: true,
  _id: false 
});

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;