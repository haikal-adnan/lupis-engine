import mongoose from 'mongoose';

const PrefabSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
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
}, { timestamps: true });

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;