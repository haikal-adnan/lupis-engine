import express from "express";
import cors from "cors";
import { connectMongo } from "./config/mongo.js";
import { connectPostgres, pool } from "./config/postgres.js";

// Import Models NoSQL
import Project from "./models/nosql/Project.js";
import Folder from "./models/nosql/Folder.js";
import Asset from "./models/nosql/Asset.js";
import Scene from "./models/nosql/Scene.js";
import Prefab from "./models/nosql/Prefab.js";

const app = express();

// Middleware
app.use(cors()); // Mengizinkan akses dari frontend domain lain
app.use(express.json());

/* ========================
    Database Connections
======================== */
export async function initDatabase() {
  await connectMongo();
  await connectPostgres();
}

/* ========================
    Game Engine API Routes
======================== */

// 1. GET ALL PROJECTS (Dashboard)
app.get("/projects", async (req, res) => {
  try { res.json(await Project.find().sort({ updatedAt: -1 })); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// [BARU] 1b. GET SINGLE PROJECT DETAILS (Settings & Layers)
// Endpoint ini yang dipanggil oleh fetchProjectDetails di frontend
app.get("/projects/:projectId", async (req, res) => {
  try { 
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });
    res.json(project); 
  } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. GET PROJECT STRUCTURE (File Tree)
app.get("/folders/:projectId", async (req, res) => {
  try { res.json(await Folder.find({ projectId: req.params.projectId })); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/assets/:projectId", async (req, res) => {
  try { res.json(await Asset.find({ projectId: req.params.projectId })); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. GET SCENE LIST (Untuk Panel Select Scene)
app.get("/scenes/project/:projectId", async (req, res) => {
  try { 
    // Hanya ambil nama dan ID agar cepat
    const scenes = await Scene.find({ projectId: req.params.projectId }).select('name _id');
    res.json(scenes); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. GET ACTIVE SCENE DATA (Untuk Canvas & Layer Tree)
app.get("/scenes/:sceneId", async (req, res) => {
  try { res.json(await Scene.findById(req.params.sceneId)); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. GET PREFABS (Untuk Panel Prefab)
app.get("/prefabs/:projectId", async (req, res) => {
  try { res.json(await Prefab.find({ projectId: req.params.projectId })); } 
  catch (e) { res.status(500).json({ error: e.message }); }
});

/* ========================
    User Routes (Postgres)
======================== */
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