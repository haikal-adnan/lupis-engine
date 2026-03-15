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

const app = express();

app.use(cors());

app.use(express.json({ limit: '5mb' }));

app.use(express.urlencoded({ limit: '5mb', extended: true }));

export async function initDatabase() {
  await connectMongo();
  await connectPostgres();
}

app.use("/auth", authRoutes);
app.use("/assets", assetRoutes);
app.use("/projects", projectRoutes);
app.use("/folders", folderRoutes);

app.get("/projects", async (req, res) => {
  try {
    res.json(await Project.find().sort({ updatedAt: -1 }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/projects/:projectId", async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/folders/:projectId", async (req, res) => {
  try {
    res.json(await Folder.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/assets/:projectId", async (req, res) => {
  try {
    res.json(await Asset.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scenes/project/:projectId", async (req, res) => {
  try {
    const scenes = await Scene.find({ projectId: req.params.projectId }).select("name _id");
    res.json(scenes);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scenes/:sceneId", async (req, res) => {
  try {
    res.json(await Scene.findById(req.params.sceneId));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/prefabs/:projectId", async (req, res) => {
  try {
    res.json(await Prefab.find({ projectId: req.params.projectId }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/scripts/:projectId", async (req, res) => {
  try {
    const scripts = await Script.find({ projectId: req.params.projectId });
    res.json(scripts);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/script/:scriptId", async (req, res) => {
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

export default app;