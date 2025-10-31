import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import projectRoutes from "./routes/projects.js";
import assetRoutes from "./routes/assets.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());

// Path dasar semua project
const projectsDir = process.env.PROJECTS_PATH || path.resolve("/home/ubuntu/lupis/projects");

// Serve file statis dari folder projects → agar bisa diakses langsung via URL
app.use("/static/projects", express.static(projectsDir));

// Routes utama
app.use("/projects", projectRoutes);
app.use("/assets", assetRoutes);

const PORT = process.env.PORT || 3303;
app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});
