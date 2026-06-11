import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  userName: { type: String, required: true },
  comment: { type: String, required: true },
  stars: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Review", reviewSchema);