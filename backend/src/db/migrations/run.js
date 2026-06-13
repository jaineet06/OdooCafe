import fs from "fs";
import path from "path";
import pool from "../../config/db.js";
import { logger } from "../../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sqlPath = path.join(__dirname, "001_initial_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = await pool.connect();
  try {
    logger.info("Running database migration...");
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    logger.info("Migration completed successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Migration failed", { error: err.message });
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
