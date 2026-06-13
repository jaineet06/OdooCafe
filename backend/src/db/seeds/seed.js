import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";
import { calculateOrderTotals, computeDiscountAmount } from "../../utils/taxCalculator.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BCRYPT_ROUNDS = 12;
const PASSWORD = "Password@123";

const TENANTS = [
  { name: "Sunrise Cafe", slug: "sunrise-cafe" },
  { name: "Metro Bistro", slug: "metro-bistro" },
];

const CATEGORIES = [
  { name: "Beverages", color: "#3B82F6" },
  { name: "Snacks", color: "#F59E0B" },
  { name: "Mains", color: "#10B981" },
  { name: "Desserts", color: "#EC4899" },
  { name: "Specials", color: "#8B5CF6" },
];

const PRODUCTS = [
  { name: "Espresso", category: "Beverages", price: 120, tax: 5, kds: false },
  { name: "Cappuccino", category: "Beverages", price: 150, tax: 5, kds: false },
  { name: "Iced Latte", category: "Beverages", price: 180, tax: 5, kds: false },
  { name: "Fresh Orange Juice", category: "Beverages", price: 140, tax: 5, kds: false },
  { name: "Croissant", category: "Snacks", price: 90, tax: 5, kds: true },
  { name: "Garlic Bread", category: "Snacks", price: 110, tax: 5, kds: true },
  { name: "Club Sandwich", category: "Snacks", price: 220, tax: 12, kds: true },
  { name: "Caesar Salad", category: "Mains", price: 280, tax: 12, kds: true },
  { name: "Margherita Pizza", category: "Mains", price: 350, tax: 12, kds: true },
  { name: "Pasta Alfredo", category: "Mains", price: 320, tax: 12, kds: true },
  { name: "Grilled Chicken", category: "Mains", price: 380, tax: 12, kds: true },
  { name: "Cheesecake", category: "Desserts", price: 200, tax: 12, kds: true },
  { name: "Chocolate Brownie", category: "Desserts", price: 160, tax: 12, kds: true },
  { name: "Tiramisu", category: "Desserts", price: 240, tax: 12, kds: true },
  { name: "Chef Special Platter", category: "Specials", price: 550, tax: 12, kds: true },
];

async function seedTenant(client, tenantInfo) {
  const { name, slug } = tenantInfo;
  console.log(`\n--- Seeding tenant: ${name} ---`);

  const tenantRes = await client.query(
    `INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id`,
    [name, slug]
  );
  const tenantId = tenantRes.rows[0].id;
  console.log(`  Created tenant: ${tenantId}`);

  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_ROUNDS);

  const adminRes = await client.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin') RETURNING id`,
    [tenantId, `${name} Admin`, `admin@${slug}.com`, passwordHash]
  );
  const adminId = adminRes.rows[0].id;

  const emp1Res = await client.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'employee') RETURNING id`,
    [tenantId, "Employee One", `emp1@${slug}.com`, passwordHash]
  );
  const emp1Id = emp1Res.rows[0].id;

  await client.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'employee')`,
    [tenantId, "Employee Two", `emp2@${slug}.com`, passwordHash]
  );
  console.log("  Created users (1 admin, 2 employees)");

  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const res = await client.query(
      `INSERT INTO product_categories (tenant_id, name, color) VALUES ($1, $2, $3) RETURNING id`,
      [tenantId, cat.name, cat.color]
    );
    categoryMap[cat.name] = res.rows[0].id;
  }
  console.log("  Created 5 categories");

  const productMap = {};
  for (const prod of PRODUCTS) {
    const res = await client.query(
      `INSERT INTO products (tenant_id, category_id, name, price, tax_rate, is_kds_visible)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [tenantId, categoryMap[prod.category], prod.name, prod.price, prod.tax, prod.kds]
    );
    productMap[prod.name] = { id: res.rows[0].id, ...prod };
  }
  console.log("  Created 15 products");

  const floorMap = {};
  for (const floorName of ["Ground Floor", "First Floor"]) {
    const res = await client.query(
      `INSERT INTO floors (tenant_id, name) VALUES ($1, $2) RETURNING id`,
      [tenantId, floorName]
    );
    floorMap[floorName] = res.rows[0].id;
  }

  for (let i = 1; i <= 6; i++) {
    await client.query(
      `INSERT INTO tables (tenant_id, floor_id, table_number, seats) VALUES ($1, $2, $3, 4)`,
      [tenantId, floorMap["Ground Floor"], String(i)]
    );
  }
  for (let i = 7; i <= 12; i++) {
    await client.query(
      `INSERT INTO tables (tenant_id, floor_id, table_number, seats) VALUES ($1, $2, $3, 4)`,
      [tenantId, floorMap["First Floor"], String(i)]
    );
  }
  console.log("  Created 2 floors with 12 tables");

  for (const method of ["cash", "card", "upi"]) {
    await client.query(
      `INSERT INTO payment_methods (tenant_id, method_type, is_enabled, upi_id)
       VALUES ($1, $2, TRUE, $3)`,
      [tenantId, method, method === "upi" ? "demo@ybl" : null]
    );
  }
  console.log("  Created payment methods");

  for (const coupon of [
    { code: "SAVE10", type: "percentage", value: 10 },
    { code: "FLAT50", type: "fixed", value: 50 },
    { code: "VIP20", type: "percentage", value: 20 },
  ]) {
    await client.query(
      `INSERT INTO coupons (tenant_id, code, discount_type, discount_value) VALUES ($1, $2, $3, $4)`,
      [tenantId, coupon.code, coupon.type, coupon.value]
    );
  }
  console.log("  Created 3 coupons");

  const espressoId = productMap["Espresso"].id;
  await client.query(
    `INSERT INTO promotions (tenant_id, name, apply_to, product_id, min_qty, discount_type, discount_value)
     VALUES ($1, 'Coffee Triple Deal', 'product', $2, 3, 'percentage', 10)`,
    [tenantId, espressoId]
  );
  await client.query(
    `INSERT INTO promotions (tenant_id, name, apply_to, min_order_amount, discount_type, discount_value)
     VALUES ($1, 'Big Order Bonus', 'order', 500, 'fixed', 30)`,
    [tenantId]
  );
  console.log("  Created 2 promotions");

  const sessionRes = await client.query(
    `INSERT INTO sessions (tenant_id, opened_by, opening_balance, status)
     VALUES ($1, $2, 500, 'open') RETURNING id`,
    [tenantId, adminId]
  );
  const sessionId = sessionRes.rows[0].id;
  console.log("  Created open session");

  const tablesRes = await client.query(
    `SELECT id FROM tables WHERE tenant_id = $1 ORDER BY table_number LIMIT 10`,
    [tenantId]
  );
  const tableIds = tablesRes.rows.map((r) => r.id);

  const orderConfigs = [
    { status: "paid", items: [{ name: "Espresso", qty: 2 }, { name: "Croissant", qty: 1 }] },
    { status: "paid", items: [{ name: "Cappuccino", qty: 1 }, { name: "Club Sandwich", qty: 1 }] },
    { status: "paid", items: [{ name: "Pasta Alfredo", qty: 1 }, { name: "Iced Latte", qty: 2 }] },
    { status: "paid", items: [{ name: "Margherita Pizza", qty: 1 }, { name: "Cheesecake", qty: 1 }] },
    { status: "paid", items: [{ name: "Chef Special Platter", qty: 1 }] },
    { status: "paid", items: [{ name: "Espresso", qty: 3 }, { name: "Garlic Bread", qty: 2 }] },
    { status: "draft", items: [{ name: "Caesar Salad", qty: 1 }, { name: "Fresh Orange Juice", qty: 1 }] },
    { status: "draft", items: [{ name: "Grilled Chicken", qty: 1 }, { name: "Tiramisu", qty: 1 }] },
    { status: "cancelled", items: [{ name: "Chocolate Brownie", qty: 2 }] },
    { status: "cancelled", items: [{ name: "Cappuccino", qty: 1 }, { name: "Croissant", qty: 1 }] },
  ];

  const kdsStages = ["to_cook", "preparing", "completed", "to_cook", "preparing", "completed", "to_cook", "preparing"];

  for (let i = 0; i < orderConfigs.length; i++) {
    const config = orderConfigs[i];
    const tableId = tableIds[i % tableIds.length];

    const calcItems = config.items.map((item) => {
      const prod = productMap[item.name];
      return {
        unitPrice: prod.price,
        quantity: item.qty,
        taxRate: prod.tax,
        productId: prod.id,
      };
    });

    let discounts = [];
    const espressoItems = config.items.filter((i) => i.name === "Espresso");
    const espressoQty = espressoItems.reduce((s, i) => s + i.qty, 0);
    if (espressoQty >= 3) {
      const base = espressoQty * productMap["Espresso"].price;
      discounts.push({ type: "item", amount: computeDiscountAmount("percentage", 10, base) });
    }
    const subtotal = calcItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    if (subtotal >= 500) {
      discounts.push({ type: "order", amount: 30 });
    }

    const totals = calculateOrderTotals(calcItems, discounts);

    const orderRes = await client.query(
      `INSERT INTO orders (tenant_id, session_id, table_id, status, subtotal, tax_total, discount_total, total, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, order_number`,
      [tenantId, sessionId, tableId, config.status, totals.subtotal, totals.taxTotal, totals.discountTotal, totals.total, emp1Id]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of config.items) {
      const prod = productMap[item.name];
      const lineTotal = prod.price * item.qty;
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, quantity, unit_price, tax_rate, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [orderId, tenantId, prod.id, item.qty, prod.price, prod.tax, lineTotal]
      );
    }

    if (config.status === "paid") {
      await client.query(
        `INSERT INTO payments (order_id, tenant_id, method_type, amount, status)
         VALUES ($1, $2, 'cash', $3, 'completed')`,
        [orderId, tenantId, totals.total]
      );
    }

    if (config.status !== "cancelled") {
      const stage = kdsStages[i] || "to_cook";
      const kdsRes = await client.query(
        `INSERT INTO kds_orders (order_id, tenant_id, stage) VALUES ($1, $2, $3) RETURNING id`,
        [orderId, tenantId, stage]
      );
      const kdsOrderId = kdsRes.rows[0].id;

      const itemsRes = await client.query(
        `SELECT oi.id, p.is_kds_visible FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         WHERE oi.order_id = $1 AND p.is_kds_visible = TRUE`,
        [orderId]
      );
      for (const oi of itemsRes.rows) {
        await client.query(
          `INSERT INTO kds_order_items (kds_order_id, order_item_id, tenant_id, is_completed)
           VALUES ($1, $2, $3, $4)`,
          [kdsOrderId, oi.id, tenantId, stage === "completed"]
        );
      }
    }
  }
  console.log("  Created 10 orders with KDS entries");
}

async function seed() {
  const client = await pool.connect();
  try {
    console.log("Starting seed...");
    await client.query("BEGIN");

    await client.query(`
      TRUNCATE kds_order_items, kds_orders, payments, order_discounts, order_items, orders,
               sessions, promotions, coupons, payment_methods, tables, floors, products,
               product_categories, customers, kds_devices, users, tenants CASCADE
    `);

    for (const tenant of TENANTS) {
      await seedTenant(client, tenant);
    }

    await client.query("COMMIT");
    console.log("\nSeed completed successfully!");
    console.log("\nLogin credentials (both tenants):");
    console.log("  admin@sunrise-cafe.com / Password@123");
    console.log("  admin@metro-bistro.com / Password@123");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Seed failed:", err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
