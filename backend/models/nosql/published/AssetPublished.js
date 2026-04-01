import mongoose from 'mongoose';

const AssetPublishedSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true }, 
  folderId: { type: String, ref: 'Folder', default: null, index: true },   
  
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['texture', 'sound', 'audio', 'font'], 
    required: true 
  },
  
  fileKey: { type: String, required: true },
  
  meta: {
    extension: { type: String, required: true },
    size: { type: Number },
    dimensions: { w: Number, h: Number },
    duration: { type: Number } 
  }
}, { 
  timestamps: true,
  _id: false
});

export default mongoose.models.AssetPublished || mongoose.model('AssetPublished', AssetPublishedSchema, 'assetsPublished');