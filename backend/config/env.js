// config/env.js
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Memuat .env dari root folder (satu level di atas folder config)
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

console.log("✅ Environment variables loaded.");