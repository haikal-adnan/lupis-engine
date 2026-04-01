import mongoose from 'mongoose';

// Menggunakan sub-schema yang sama persis
const PortSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  label: { type: String, default: '' },
  dataType: { 
    type: String, 
    enum: ['execution', 'string', 'number', 'boolean', 'object', 'vector', 'map', 'any', 'array', 'list'], 
    default: 'any' 
  },
  color: { type: String, default: '#ffffff' },
  enabled: { type: Boolean, default: true },
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
    category: { type: String, default: 'General' },
    description: { type: String, default: '' },
    visibleDataFields: { type: [String], default: [] }
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

const ScriptPublishedSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  projectId: { type: String, ref: 'Project', required: true, index: true },
  name: { type: String, required: true },
  type: { type: String, default: 'component' },
  active: { type: Boolean, default: true }, 
  exposedVariables: {
    type: [{
      _id: { type: String, required: true },
      name: String,
      type: { type: String, default: 'number' },
      defaultValue: mongoose.Schema.Types.Mixed
    }],
    default: []
  },
  nodes: { type: [NodeSchema], default: [] },
  edges: { type: [EdgeSchema], default: [] }
}, { 
  timestamps: true,
  _id: false 
});

export default mongoose.models.ScriptPublished || mongoose.model('ScriptPublished', ScriptPublishedSchema, 'scriptsPublished');