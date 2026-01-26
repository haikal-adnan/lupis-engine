import mongoose from 'mongoose';

const PortSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  label: { type: String, default: '' },
  type: { type: String, default: 'any' },
  dataType: { 
    type: String, 
    enum: ['execution', 'string', 'number', 'boolean', 'vector', 'object', 'any'], 
    default: 'any' 
  },
  color: { type: String, default: '#555' },
  enabled: { type: Boolean, default: true }
}, { _id: false });

const NodeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  type: { type: String, required: true },
  position: { 
    x: { type: Number, default: 0 }, 
    y: { type: Number, default: 0 } 
  },
  settings: {
    headerTitle: { type: String, default: 'Node' },
    description: { type: String, default: '' },
    headerColor: { type: String, default: '#fff' },
    category: { type: String, default: 'General' },
    visibleDataFields: { type: [String], default: [] }
  },
  inputs: { type: [PortSchema], default: [] },
  outputs: { type: [PortSchema], default: [] },
  data: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { _id: false }); 

const EdgeSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  source: { type: String, required: true },
  sourceHandle: { type: String, default: null }, 
  target: { type: String, required: true },
  targetHandle: { type: String, default: null }  
}, { _id: false });

const ScriptSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['component', 'scene_logic'], 
    default: 'component' 
  },
  exposedVariables: {
    type: [{
      _id: { type: String, required: true },
      name: String,
      type: { type: String, default: 'String' },
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
