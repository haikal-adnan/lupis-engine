// postgres.js
import pkg from "pg";
const { Pool } = pkg;

// Hapus "export const pool = new Pool(...)" yang langsung dieksekusi

export let pool; // Deklarasi variabel kosong dulu

export const connectPostgres = async () => {
  // Inisialisasi Pool DI SINI (saat fungsi dipanggil, env sudah siap)
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    await pool.query("SELECT 1");
    console.log("🐘 PostgreSQL connected");
  } catch (error) {
    console.error("❌ PostgreSQL connection error:", error.message);
    process.exit(1);
  }
};