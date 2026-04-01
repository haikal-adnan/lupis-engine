import mongoose from 'mongoose';

const PublishedSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  
  projectId: { type: String, required: true, index: true },
  
  ownerId: { type: String, required: true, index: true }, 
  
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true }, 
  description: { type: String, default: "" },
  thumbnailUrl: { type: String, default: null },

  playOnBrowser: { type: Boolean, default: false }, 

  downloads: {
    exe: { type: String, default: null },
    apk: { type: String, default: null },
    bin: { type: String, default: null }
  }
}, { 
  timestamps: true,
  _id: false 
});

const Published = mongoose.models.Published || mongoose.model('Published', PublishedSchema);
export default Published;