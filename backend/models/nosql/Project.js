import mongoose from 'mongoose';

// Schema kecil untuk Variable agar konsisten dengan Script.js
const VariableSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['String', 'Number', 'Boolean', 'Vector'], 
    default: 'String' 
  },
  defaultValue: mongoose.Schema.Types.Mixed
}, { _id: false }); // _id false karena kita biasanya cari by name

const ProjectSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  
  settings: {
    width: { type: Number, default: 1280 },
    height: { type: Number, default: 720 }
  },
  
  // --- UPDATE BARU: Global Variables ---
  // Menyimpan data yang bisa diakses oleh semua script (Get/Set Global)
  globalVariables: [VariableSchema],

  scenes: [{ type: String, ref: 'Scene' }],
  thumbnailUrl: { type: String }
}, { 
  timestamps: true,
  _id: false 
});

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
export default Project;