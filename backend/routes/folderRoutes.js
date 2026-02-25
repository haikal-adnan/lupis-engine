import express from "express";
import Folder from "../models/nosql/Folder.js";
import { createFolder } from "../bin/createFolder.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  try {
    const { folderId, projectId, name, parentId } = req.body;

    if (!projectId || !name) {
      return res.status(400).json({ success: false, error: "Parameter projectId dan name wajib diisi." });
    }

    const newFolder = await createFolder({ folderId, projectId, name, parentId });

    res.status(201).json({
      success: true,
      data: newFolder
    });
  } catch (error) {
    console.error("[Route Error] Gagal membuat folder:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan server saat membuat folder." });
  }
});

router.get("/project/:projectId", async (req, res) => {
  try {
    const { projectId } = req.params;
    
    const folders = await Folder.find({ projectId });

    res.status(200).json({
      success: true,
      data: folders
    });
  } catch (error) {
    console.error("[Route Error] Gagal mengambil folder:", error);
    res.status(500).json({ success: false, error: "Gagal mengambil data folder dari server." });
  }
});

router.put("/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;
    const { name, parentId } = req.body;

    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (parentId !== undefined) updateFields.parentId = parentId;

    const updatedFolder = await Folder.findByIdAndUpdate(
      folderId,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedFolder) {
      return res.status(404).json({ success: false, error: "Folder tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      data: updatedFolder
    });
  } catch (error) {
    console.error("[Route Error] Gagal update folder:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan saat update folder." });
  }
});

router.delete("/:folderId", async (req, res) => {
  try {
    const { folderId } = req.params;

    const deletedFolder = await Folder.findByIdAndDelete(folderId);

    if (!deletedFolder) {
      return res.status(404).json({ success: false, error: "Folder tidak ditemukan." });
    }

    res.status(200).json({
      success: true,
      message: "Folder berhasil dihapus."
    });
  } catch (error) {
    console.error("[Route Error] Gagal menghapus folder:", error);
    res.status(500).json({ success: false, error: "Terjadi kesalahan saat menghapus folder." });
  }
});

export default router;