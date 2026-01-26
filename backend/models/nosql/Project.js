import mongoose from 'mongoose';

const VariableSchema = new mongoose.Schema({
  _id: { type: String, required: true }, 
  name: { type: String, required: true },
  type: { type: String, default: 'String' },
  defaultValue: mongoose.Schema.Types.Mixed
}); 

const EventSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  name: { type: String, required: true }, 
  description: { type: String, default: '' }
});

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  
  settings: {
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 }
  },
  
  globalVariables: [VariableSchema],
  globalEvents: [EventSchema], 

  tags: { 
    type: [String], 
    default: ['Untagged', 'Player', 'Enemy', 'Terrain', 'UI'] 
  },

  scenes: [{ type: String, ref: 'Scene' }],
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export default Project;