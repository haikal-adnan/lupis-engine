import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ GET /preview → test route
router.get("/", (req, res) => {
  res.send("<h3>Nyeyeyeye.</h3>");
});

// ✅ POST /preview/start
router.post("/start", async (req, res) => {
  const { project } = req.body;
  if (!project) return res.status(400).json({ error: "Missing project" });

  console.log(`🟢 Request preview project: ${project}`);
  return res.json({ url: `/preview/${project}` });
});

// ✅ GET /preview/:project
router.get("/:project", (req, res) => {
  const previewPath = path.resolve(__dirname, "../../preview/preview.html");
  res.sendFile(previewPath);
});

export default router;
