import mongoose from 'mongoose';

const PortSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  label: { type: String, default: '' },
  dataType: { 
    type: String, 
    enum: ['execution', 'string', 'number', 'boolean', 'object', 'vector', 'any'], 
    default: 'any' 
  },
  color: { type: String, default: '#ffffff' },
  defaultValue: { type: mongoose.Schema.Types.Mixed, default: null } 
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  label: { type: String },
  position: { 
    x: { type: Number, default: 0 }, 
    y: { type: Number, default: 0 } 
  },
  settings: {
    headerTitle: { type: String, default: 'Node' },
    headerColor: { type: String, default: '#333' },
    category: { type: String, default: 'General' }
  },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  inputs: { type: [PortSchema], default: [] },
  outputs: { type: [PortSchema], default: [] }
}, { _id: false }); 

const EdgeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  source: { type: String, required: true },
  sourceHandle: { type: String, required: true },
  target: { type: String, required: true },
  targetHandle: { type: String, required: true }
}, { _id: false });

const ScriptSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  active: { type: Boolean, default: true }, 
  exposedVariables: {
    type: [{
      _id: { type: String, required: true },
      name: String,
      type: { type: String, default: 'string' },
      defaultValue: mongoose.Schema.Types.Mixed
    }],
    default: []
  },
  nodes: {
    type: [NodeSchema],
    default: []
  },
  edges: {
    type: [EdgeSchema],
    default: []
  }
}, { 
  timestamps: true,
  _id: false 
});

export default mongoose.models.Script || mongoose.model('Script', ScriptSchema);