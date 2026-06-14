import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import pg from "pg";
import { calculateOrderTotals, computeDiscountAmount } from "../utils/taxCalculator.js";

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const BCRYPT_ROUNDS = 12;
const PASSWORD = "Password@123";

const TENANTS = [
  { name: "Sunrise Cafe", slug: "sunrise-cafe" },
  { name: "Metro Bistro", slug: "metro-bistro" },
  { name: "Terraza Lounge", slug: "terraza-lounge" },
];

const CATEGORIES = [
  { name: "Beverages", color: "#3B82F6" },
  { name: "Snacks", color: "#F59E0B" },
  { name: "Mains", color: "#10B981" },
  { name: "Desserts", color: "#EC4899" },
  { name: "Specials", color: "#8B5CF6" },
];

const PRODUCTS = [
  { name: "Espresso", category: "Beverages", price: 120, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1510591509098-fd97982945b4?w=400&h=300&fit=crop" },
  { name: "Cappuccino", category: "Beverages", price: 150, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1572442385786-08368e1f5103?w=400&h=300&fit=crop" },
  { name: "Iced Latte", category: "Beverages", price: 180, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop" },
  { name: "Fresh Orange Juice", category: "Beverages", price: 140, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1621506279837-caa3aa2f417e?w=400&h=300&fit=crop" },
  { name: "Green Tea", category: "Beverages", price: 100, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&h=300&fit=crop" },
  { name: "Vanilla Shake", category: "Beverages", price: 160, tax: 5, kds: false, image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop" },
  
  { name: "Croissant", category: "Snacks", price: 90, tax: 5, kds: true, image: "https://images.unsplash.com/photo-1555507036-ab794f1bc09?w=400&h=300&fit=crop" },
  { name: "Garlic Bread", category: "Snacks", price: 110, tax: 5, kds: true, image: "https://images.unsplash.com/photo-1573140405366-6f6e7c0e2d1f?w=400&h=300&fit=crop" },
  { name: "Club Sandwich", category: "Snacks", price: 220, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1528735609216-77b0a7d4e6b4?w=400&h=300&fit=crop" },
  { name: "French Fries", category: "Snacks", price: 130, tax: 5, kds: true, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop" },
  { name: "Paneer Tikka Roll", category: "Snacks", price: 190, tax: 5, kds: true, image: "https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400&h=300&fit=crop" },
  
  { name: "Caesar Salad", category: "Mains", price: 280, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop" },
  { name: "Margherita Pizza", category: "Mains", price: 350, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop" },
  { name: "Pasta Alfredo", category: "Mains", price: 320, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop" },
  { name: "Grilled Chicken", category: "Mains", price: 380, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1598103442097-8b74394e95a4?w=400&h=300&fit=crop" },
  { name: "Veggie Burger", category: "Mains", price: 240, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&h=300&fit=crop" },
  
  { name: "Cheesecake", category: "Desserts", price: 200, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1524351199428-8f4b7892aefb?w=400&h=300&fit=crop" },
  { name: "Chocolate Brownie", category: "Desserts", price: 160, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1607924482614-99472d5b0c64?w=400&h=300&fit=crop" },
  { name: "Tiramisu", category: "Desserts", price: 240, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1571877227200-a4d21dd04d39?w=400&h=300&fit=crop" },
  { name: "Lava Cake", category: "Desserts", price: 180, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop" },
  
  { name: "Chef Special Platter", category: "Specials", price: 550, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop" },
  { name: "Premium Sushi Platter", category: "Specials", price: 720, tax: 12, kds: true, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=300&fit=crop" },
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

  const employeeIds = [];
  const empNames = ["Employee One", "Employee Two", "Employee Three", "Employee Four", "Employee Five"];
  for (let i = 0; i < empNames.length; i++) {
    const empRes = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, 'employee') RETURNING id`,
      [tenantId, empNames[i], `emp${i + 1}@${slug}.com`, passwordHash]
    );
    employeeIds.push(empRes.rows[0].id);
  }
  console.log("  Created users (1 admin, 5 employees)");

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
      `INSERT INTO products (tenant_id, category_id, name, price, tax_rate, is_kds_visible, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [tenantId, categoryMap[prod.category], prod.name, prod.price, prod.tax, prod.kds, prod.image]
    );
    productMap[prod.name] = { id: res.rows[0].id, ...prod };
  }
  console.log("  Created products catalog");

  const floorMap = {};
  for (const floorName of ["Ground Floor", "First Floor"]) {
    const res = await client.query(
      `INSERT INTO floors (tenant_id, name) VALUES ($1, $2) RETURNING id`,
      [tenantId, floorName]
    );
    floorMap[floorName] = res.rows[0].id;
  }

  const shapes = ["square", "rectangle", "round"];
  for (let i = 1; i <= 6; i++) {
    const seats = i % 2 === 0 ? 6 : 4;
    const shape = shapes[i % 3];
    await client.query(
      `INSERT INTO tables (tenant_id, floor_id, table_number, seats, shape) VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, floorMap["Ground Floor"], String(i), seats, shape]
    );
  }
  for (let i = 7; i <= 12; i++) {
    const seats = i % 2 === 0 ? 2 : 4;
    const shape = shapes[i % 3];
    await client.query(
      `INSERT INTO tables (tenant_id, floor_id, table_number, seats, shape) VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, floorMap["First Floor"], String(i), seats, shape]
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
    `SELECT id FROM tables WHERE tenant_id = $1 ORDER BY table_number`,
    [tenantId]
  );
  const tableIds = tablesRes.rows.map((r) => r.id);

  const customerIds = [];
  for (let i = 1; i <= 25; i++) {
    const custRes = await client.query(
      `INSERT INTO customers (tenant_id, name, phone, email)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [tenantId, `Customer ${i}`, `555-01${i.toString().padStart(2, "0")}`, `customer${i}@example.com`]
    );
    customerIds.push(custRes.rows[0].id);
  }
  console.log("  Created 25 customers for tenant");

  const productNames = Object.keys(productMap);
  const kdsStages = ["to_cook", "preparing", "completed"];
  const statuses = ["paid", "draft", "cancelled"];
  
  const numOrders = 150;
  for (let i = 1; i <= numOrders; i++) {
    const status = statuses[i % 12 === 0 ? 2 : (i % 12 < 3 ? 1 : 0)]; 
    
    const orderItemsCount = 1 + Math.floor(Math.random() * 4);
    const chosenProducts = [];
    while (chosenProducts.length < orderItemsCount) {
      const prodName = productNames[Math.floor(Math.random() * productNames.length)];
      if (!chosenProducts.includes(prodName)) {
        chosenProducts.push(prodName);
      }
    }

    const orderItems = chosenProducts.map((pName) => {
      const prod = productMap[pName];
      const qty = 1 + Math.floor(Math.random() * 3);
      const lineTotal = prod.price * qty;
      return {
        productId: prod.id,
        name: prod.name,
        qty,
        unitPrice: prod.price,
        taxRate: prod.tax,
        lineTotal,
        isKdsVisible: prod.kds,
      };
    });

    const subtotal = orderItems.reduce((s, item) => s + item.lineTotal, 0);
    
    let discountTotal = 0;
    let discounts = [];
    const espressoItems = orderItems.filter((item) => item.name === "Espresso");
    const espressoQty = espressoItems.reduce((s, item) => s + item.qty, 0);
    if (espressoQty >= 3) {
      const base = espressoQty * productMap["Espresso"].price;
      const amt = base * 0.1;
      discounts.push({ type: "item", amount: amt });
      discountTotal += amt;
    }
    if (subtotal >= 500) {
      discounts.push({ type: "order", amount: 30 });
      discountTotal += 30;
    }

    const taxTotal = orderItems.reduce((s, item) => s + (item.lineTotal * item.taxRate) / 100, 0);
    const tipAmount = status === "paid" ? (Math.random() > 0.5 ? (Math.random() > 0.5 ? 20 : 10) : 0) : 0;
    const total = subtotal + taxTotal - discountTotal + tipAmount;

    const tableId = Math.random() > 0.2 ? tableIds[i % tableIds.length] : null;
    const customerId = Math.random() > 0.3 ? customerIds[i % customerIds.length] : null;
    const createdBy = employeeIds[i % employeeIds.length];

    const date = new Date();
    date.setDate(date.getDate() - (i % 60)); // Span past 60 days
    date.setHours(8 + (i % 14), (i * 11) % 60, 0, 0);

    const orderRes = await client.query(
      `INSERT INTO orders (tenant_id, session_id, table_id, customer_id, status, subtotal, tax_total, discount_total, tip_amount, total, created_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id, order_number`,
      [
        tenantId,
        sessionId,
        tableId,
        customerId,
        status,
        subtotal,
        taxTotal,
        discountTotal,
        tipAmount,
        total,
        date,
        createdBy,
      ]
    );
    const orderId = orderRes.rows[0].id;

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (order_id, tenant_id, product_id, quantity, unit_price, tax_rate, line_total, note)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [orderId, tenantId, item.productId, item.qty, item.unitPrice, item.taxRate, item.lineTotal, Math.random() > 0.8 ? "no ice" : null]
      );
    }

    if (status === "paid") {
      const payMethod = ["cash", "card", "upi"][i % 3];
      await client.query(
        `INSERT INTO payments (order_id, tenant_id, method_type, amount, status, created_at)
         VALUES ($1, $2, $3, $4, 'completed', $5)`,
        [orderId, tenantId, payMethod, total, date]
      );
    }

    if (status === "draft" && tableId) {
      await client.query(
        `UPDATE tables SET is_occupied = TRUE, occupied_since = COALESCE(occupied_since, $1) WHERE id = $2`,
        [date, tableId]
      );
    }

    if (status !== "cancelled") {
      const stage = kdsStages[i % kdsStages.length];
      const kdsRes = await client.query(
        `INSERT INTO kds_orders (order_id, tenant_id, stage, sent_at, updated_at) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [orderId, tenantId, stage, date, date]
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
  console.log(`  Created ${numOrders} orders with KDS entries`);
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
    console.log("\nLogin credentials (all tenants):");
    console.log("  admin@sunrise-cafe.com / Password@123");
    console.log("  admin@metro-bistro.com / Password@123");
    console.log("  admin@terraza-lounge.com / Password@123");
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
