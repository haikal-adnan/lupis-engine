import express from "express";
import { getAssets } from "../controllers/assetsController.js";
const router = express.Router();

router.get("/:projectId", getAssets);

export default router;
