import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true },
  folderId: { type: String, ref: 'Folder', default: null },
  
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['texture', 'sound', 'font', 'script', 'video'], 
    required: true 
  },
  
  fileUrl: { type: String, required: true }, 
  
  fileKey: { type: String, required: true }, 
  
  meta: {
    extension: { type: String, required: true },
    size: { type: Number },
    dimensions: { w: Number, h: Number },
    filterMode: { type: String, enum: ['nearest', 'linear'], default: 'nearest' } 
  }
}, { 
  timestamps: true,
  _id: false
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
export default Asset;