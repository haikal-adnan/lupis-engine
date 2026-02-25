import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  parentId: { type: String, ref: 'Folder', default: null, index: true }
}, { 
  timestamps: true,
  _id: false 
});

const Folder = mongoose.models.Folder || mongoose.model('Folder', FolderSchema);
export default Folder;