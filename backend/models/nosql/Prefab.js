import mongoose from 'mongoose';

const PrefabSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  name: { type: String, required: true },
  data: {
    tag: { type: String, default: 'Untagged' },
    layerId: { type: String },
    components: { type: mongoose.Schema.Types.Mixed, default: {} },
    
    // --- PERBAIKAN: MENYAMAKAN STRUKTUR DENGAN ENTITY ---
    transform: {
      translate: { 
          x: { type: Number, default: 0 }, 
          y: { type: Number, default: 0 } 
      },
      width:  { type: Number, default: 0 }, 
      height: { type: Number, default: 0 },
      rotation: { type: Number, default: 0 },
      scale: { 
          x: { type: Number, default: 1 }, 
          y: { type: Number, default: 1 } 
      },
      pivot: { 
          x: { type: Number, default: 0.5 }, 
          y: { type: Number, default: 0.5 } 
      },
      zIndex: { type: Number, default: 0 }
    }
  },
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Prefab = mongoose.models.Prefab || mongoose.model('Prefab', PrefabSchema);
export default Prefab;