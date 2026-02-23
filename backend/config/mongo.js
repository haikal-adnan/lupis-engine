import mongoose from "mongoose";

export const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log("MONGO_URI:", process.env.MONGO_URI);
    
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};
