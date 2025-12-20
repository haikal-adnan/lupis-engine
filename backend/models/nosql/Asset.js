import mongoose from 'mongoose';
import path from 'path';
import { randomUUID } from 'crypto';

const AssetSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['texture', 'sound', 'font', 'script', 'video'], 
    required: true 
  },
  fileKey: { 
    type: String, 
    required: true, 
    default: () => randomUUID() 
  }, 
  meta: {
    extension: { type: String, required: true },
    size: { type: Number },
    dimensions: { w: Number, h: Number },
    filterMode: { type: String, enum: ['nearest', 'linear'], default: 'nearest' } 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
});

AssetSchema.virtual('url').get(function() {
  const baseUrl = process.env.CDN_BASE_URL || 'http://localhost:3000/cdn';
  return `${baseUrl}/${this.fileKey}${this.meta.extension}`;
});

AssetSchema.virtual('path').get(function() {
  const basePath = process.env.STORAGE_BASE_PATH || '';
  return path.join(basePath, `${this.fileKey}${this.meta.extension}`);
});

const Asset = mongoose.models.Asset || mongoose.model('Asset', AssetSchema);
export default Asset;