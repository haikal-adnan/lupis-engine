import mongoose from 'mongoose';

const PrefabSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  name: { type: String, required: true },
  data: {
    tag: { type: String, default: 'Untagged' },
    layerId: { type: String },
    components: { type: mongoose.Schema.Types.Mixed, default: {} },
    transform: {
      scale: { x: { type: Number, default: 1 }, y: { type: Number, default: 1 } },
      rotation: { type: Number, default: 0 }
    }
  },
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;