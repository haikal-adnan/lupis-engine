import mongoose from 'mongoose';

const LayerSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  name: { type: String, required: true },
  order: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  visible: { type: Boolean, default: true }
}, { _id: false });

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  settings: {
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 }
  },
  layers: [LayerSchema],
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export default Project;