import express from "express";
import {
  getAllProjects,
  getProjectDetail,
  getProjectTree,
  getProjectFileRegex,
  getProjectConfig
} from "../controllers/projectsController.js";

const router = express.Router();

router.get("/", getAllProjects);
router.get("/:id", getProjectDetail);
router.get("/:id/tree", getProjectTree);
router.get("/:id/config", getProjectConfig);
router.get(/^\/([^/]+)\/file\/(.+)$/, getProjectFileRegex);

export default router;
