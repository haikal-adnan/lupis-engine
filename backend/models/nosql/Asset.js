import mongoose from 'mongoose';

const AssetSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true }, 
  folderId: { type: String, ref: 'Folder', default: null, index: true },   
  
  name: { type: String, required: true },
  type: { 
    type: String, 
    // 1. Tambahkan 'audio' ke dalam enum agar Mongoose tidak menolak data
    enum: ['texture', 'sound', 'audio', 'font'], 
    required: true 
  },
  
  fileKey: { type: String, required: true },
  
  meta: {
    extension: { type: String, required: true },
    size: { type: Number },
    dimensions: { w: Number, h: Number },
    filterMode: { type: String, default: 'linear' },
    // 2. Tambahkan property duration untuk menampung panjang audio
    duration: { type: Number } 
  }
}, { 
  timestamps: true,
  _id: false
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
export default Asset;