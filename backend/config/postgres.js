import pkg from "pg";
const { Pool } = pkg;

export let pool;

export const connectPostgres = async () => {
  pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    await pool.query("SELECT 1");
    console.log("PostgreSQL connected");
  } catch (error) {
    console.error("PostgreSQL connection error:", error.message);
    process.exit(1);
  }
};