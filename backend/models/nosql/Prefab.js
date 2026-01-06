import mongoose from 'mongoose';

const EditorStateSchema = new mongoose.Schema({
    locked: { type: Boolean, default: false },
    expanded: { type: Boolean, default: false },
    hiddenInList: { type: Boolean, default: false }
}, { _id: false });

const PrefabDataSchema = new mongoose.Schema({
  type: { 
    type: String, 
    enum: ['entity', 'group'],
    default: 'entity' 
  },
  name: { type: String },
  tag: { type: String, default: 'untagged' },
  prefabId: { type: String, ref: 'Prefab', default: null },
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
  data: { type: PrefabDataSchema, default: () => ({}) },
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;
