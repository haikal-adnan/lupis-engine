import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import projectRoutes from "./routes/projects.js";
import assetRoutes from "./routes/assets.js";
import previewRoutes from "./routes/preview.js";

// === Inisialisasi dasar ===
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// === Middleware ===
app.use(cors());
app.use(express.json());

// === Path dasar project ===
const projectsDir = process.env.PROJECTS_PATH || path.resolve("/home/ubuntu/lupis/projects");
app.use("/projects", express.static(projectsDir)); // 🔹 tambahkan ini
// === Static file serving ===
// Folder project (agar aset game dapat diakses)
app.use("/static/projects", express.static(projectsDir));

// Folder engine (agar main.js dan modul engine bisa diakses)
const engineDir = path.resolve(__dirname, "../engine");
app.use("/engine", express.static(engineDir));

// Folder root (opsional, untuk akses langsung index.html / preview.html)
const rootDir = path.resolve(__dirname, "../");
app.use("/", express.static(rootDir));

// === Routes utama ===
app.use("/projects", projectRoutes);
app.use("/assets", assetRoutes);
app.use("/preview", previewRoutes);

// === Jalankan server ===
const PORT = process.env.PORT || 3303;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
