import "./config/env.js";
import app, { initDatabase } from "./app.js";

async function bootstrap() {
  try {
    console.log("Initializing database...");
    await initDatabase();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Bootstrap failed:", err);
    process.exit(1);
  }
}

bootstrap();