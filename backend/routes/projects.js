import express from "express";
import {
  getAllProjects,
  getProjectDetail,
  getProjectTree,
  getProjectFileRegex, // ⬅️ gunakan handler regex
} from "../controllers/projectsController.js";

const router = express.Router();

router.get("/", getAllProjects);
router.get("/:id", getProjectDetail);
router.get("/:id/tree", getProjectTree);

// ⬇️ PENTING: letakkan PALING BAWAH agar tidak “menangkap” route lain
// Pola: /projects/<id>/file/<apa pun>  → tangkap <id> dan sisa path file
router.get(/^\/([^/]+)\/file\/(.+)$/, getProjectFileRegex);

export default router;
