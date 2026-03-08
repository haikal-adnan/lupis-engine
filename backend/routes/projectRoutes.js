import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createEmptyProject } from "../bin/emptyProject.js";
import Project from "../models/nosql/Project.js";
import { syncProjectData } from "../utils/projectSyncHelper.js"; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const STORAGE_BASE_PATH = path.resolve(__dirname, "../../storage/projects");

router.post("/create", async (req, res) => {
  try {
    const { userId, projectName, description = "", type = "empty" } = req.body;

    if (!userId || !projectName) {
      return res.status(400).json({ success: false, error: "Parameter userId dan projectName wajib diisi." });
    }

    let newProject;
    if (type === "empty") {
      newProject = await createEmptyProject(userId, projectName, description);
    } else {
      return res.status(400).json({ success: false, error: "Tipe project belum didukung saat ini." });
    }

    const projectId = newProject._id;
    const projectFolder = path.join(STORAGE_BASE_PATH, projectId.toString());
    
    try {
      await fs.mkdir(projectFolder, { recursive: true });
    } catch (fsError) {
      console.error("[Storage Error] Gagal membuat folder:", fsError);
      return res.status(500).json({ success: false, error: "Project tersimpan di database, tetapi gagal membuat direktori storage." });
    }

    res.status(201).json({
      success: true,
      message: "Project baru berhasil dibuat.",
      data: { projectId, name: newProject.name, type }
    });
  } catch (error) {
    console.error("[Route Error] Gagal membuat project:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan pada server." });
  }
});

router.get("/owner/:ownerId", async (req, res) => {
  try {
    const { ownerId } = req.params;
    if (!ownerId) return res.status(400).json({ success: false, error: "Parameter ownerId wajib diisi." });

    const projects = await Project.find({ ownerId })
                                  .select('_id name description tags settings updatedAt')
                                  .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    console.error("[Route Error] Gagal mengambil project:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan pada server saat mengambil project." });
  }
});

router.put("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const updateData = req.body; 

    const updatedProject = await Project.findByIdAndUpdate(
      projectId,
      { $set: updateData }, 
      { 
        new: true, 
        runValidators: true,
        overwrite: false 
      } 
    );

    if (!updatedProject) {
      return res.status(404).json({ success: false, error: "Project tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      data: updatedProject
    });

  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

router.delete("/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;

    const deletedProject = await Project.findByIdAndDelete(projectId);

    if (!deletedProject) {
      return res.status(404).json({ success: false, error: "Project tidak ditemukan di database." });
    }

    const projectFolder = path.join(STORAGE_BASE_PATH, projectId.toString());
    
    try {
      await fs.rm(projectFolder, { recursive: true, force: true });
      console.log(`[Storage] Berhasil menghapus folder project: ${projectFolder}`);
    } catch (fsError) {
      console.error(`[Storage Warning] Folder project ${projectId} tidak ditemukan atau gagal dihapus:`, fsError.message);
    }

    res.status(200).json({
      success: true,
      message: "Project beserta foldernya berhasil dihapus."
    });

  } catch (error) {
    console.error("[Route Error] Gagal menghapus project:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan pada server saat menghapus project." });
  }
});



router.post("/:projectId/sync", async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    if (!payload || !payload.project) {
      return res.status(400).json({ success: false, error: "Payload tidak valid atau kosong." });
    }

    await syncProjectData(projectId, payload);

    res.status(200).json({
      success: true,
      message: "Project beserta Scene, Prefab, dan Script berhasil disinkronisasi ke database."
    });

  } catch (error) {
    console.error("[Route Error] Gagal sync project:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan saat sinkronisasi data." });
  }
});

export default router;