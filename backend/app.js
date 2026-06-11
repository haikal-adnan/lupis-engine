import express from "express";
import cors from "cors";
import { connectMongo } from "./config/mongo.js";
import { connectPostgres, pool } from "./config/postgres.js";

import { verifyToken } from "./middleware/authMiddleware.js";

import Project from "./models/nosql/Project.js";
import Folder from "./models/nosql/Folder.js";
import Asset from "./models/nosql/Asset.js";
import Scene from "./models/nosql/Scene.js";
import Prefab from "./models/nosql/Prefab.js";
import Script from "./models/nosql/Script.js"; 

import assetRoutes from "./routes/assetRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import folderRoutes from "./routes/folderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import publishRoutes from "./routes/publishRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";

import { sendOTPEmail } from "./services/email.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

export async function initDatabase() {
  await connectMongo();
  await connectPostgres();
}

app.use("/auth", authRoutes);
app.use("/publish", publishRoutes);
app.use("/profile", profileRoutes);
app.use("/assets", verifyToken, assetRoutes);
app.use("/projects", verifyToken, projectRoutes);
app.use("/folders", verifyToken, folderRoutes);


app.get("/projects", verifyToken, async (req, res) => {
  try {
    res.json(await Project.find().sort({ updatedAt: -1 }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/projects/:projectId", verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/folders/:projectId", verifyToken, async (req, res) => {
  try {
    res.json(await Folder.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/assets/:projectId", verifyToken, async (req, res) => {
  try {
    res.json(await Asset.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scenes/project/:projectId", verifyToken, async (req, res) => {
  try {
    const scenes = await Scene.find({ projectId: req.params.projectId }).select("name _id");
    res.json(scenes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scenes/:sceneId", verifyToken, async (req, res) => {
  try {
    res.json(await Scene.findById(req.params.sceneId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/prefabs/:projectId", verifyToken, async (req, res) => {
  try {
    res.json(await Prefab.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scripts/:projectId", verifyToken, async (req, res) => {
  try {
    const scripts = await Script.find({ projectId: req.params.projectId });
    res.json(scripts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/script/:scriptId", verifyToken, async (req, res) => {
  try {
    const script = await Script.findById(req.params.scriptId);
    if (!script) return res.status(404).json({ error: "Script not found" });
    res.json(script);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/test-users", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    res.json({
      message: "Data fetched successfully",
      total: result.rowCount,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/test-email", async (req, res) => {
  const { email, userName, otp } = req.body;

  if (!email || !userName || !otp) {
    return res.status(400).json({ error: "Email, userName, and otp are required" });
  }

  const result = await sendOTPEmail(email, userName, otp);

  if (result.success) {
    res.json({ message: "Email sent successfully!", detail: result.data });
  } else {
    res.status(500).json({ error: "Failed to send email", detail: result.error });
  }
});

import Review from "./models/nosql/Review.js"; 

app.post("/api/reviews", async (req, res) => {
  try {
    const { userName, comment, stars } = req.body;

    if (!userName || !comment || stars === undefined) {
      return res.status(400).json({
        success: false,
        message: "Semua field (userName, comment, stars) harus diisi"
      });
    }

    const newReview = new Review({
      userName,
      comment,
      stars: parseInt(stars)
    });

    const savedReview = await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review berhasil disimpan",
      data: savedReview
    });

  } catch (e) {
    res.status(500).json({ 
      success: false, 
      error: e.message 
    });
  }
});

app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      total: reviews.length,
      data: reviews
    });

  } catch (e) {
    res.status(500).json({ 
      success: false, 
      error: e.message 
    });
  }
});

export default app;