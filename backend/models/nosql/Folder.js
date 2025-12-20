import mongoose from 'mongoose';

const FolderSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  name: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null }
}, { timestamps: true });

const Folder = mongoose.models.Folder || mongoose.model('Folder', FolderSchema);
export default Folder;