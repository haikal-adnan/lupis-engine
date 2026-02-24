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
    tickRate: { type: Number, default: 60 },
    
    ui: {
      width: { type: Number, default: 1920 },
      height: { type: Number, default: 1080 },
      showUIBorder: { type: Boolean, default: true },
      active: { type: Boolean, default: true }
    },

    grid: {
      width: { type: Number, default: 32 },
      height: { type: Number, default: 32 },
      color: { type: String, default: '#ffffff' },
      opacity: { type: Number, default: 0.1 },
      visible: { type: Boolean, default: true }, 
      snap: { type: Boolean, default: true }    
    }
  },
  
  globalVariables: [VariableSchema],

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