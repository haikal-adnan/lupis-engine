import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  settings: {
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 }
  },
  layers: [
    {
      id: { type: String },
      name: { type: String },
      order: { type: Number },
      locked: { type: Boolean, default: false },
      visible: { type: Boolean, default: true }
    }
  ],
  thumbnailUrl: { type: String }
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export default Project;