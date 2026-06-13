import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../../config/db.js";
import { logger } from "../../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DROP_SQL = `
  DROP TABLE IF EXISTS kds_order_items, kds_orders, payments, order_discounts, order_items, orders,
               sessions, promotions, coupons, payment_methods, tables, floors, products,
               product_categories, customers, kds_devices, users, tenants CASCADE;
`;

async function migrate() {
  const sqlPath = path.join(__dirname, "001_initial_schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = await pool.connect();
  try {
    logger.info("Dropping existing tables...");
    await client.query("BEGIN");
    await client.query(DROP_SQL);
    logger.info("Running database migration...");
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
