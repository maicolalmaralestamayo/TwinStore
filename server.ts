import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import {
  getDb,
  persistDb,
  saveStoreToDb,
  rowToStore,
  saveProductToDb,
  rowToProduct,
  saveConfigToDb,
  rowToConfig,
} from "./server/database.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// API route: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "TwinStore API (SQLite Powered: twinstore.sqlite)" });
});

// API route: Get UI Strings from interfaz.json
app.get("/api/interfaz", (req, res) => {
  try {
    const targetPath = path.join(process.cwd(), "src", "data", "interfaz.json");
    const content = fs.readFileSync(targetPath, "utf-8");
    res.json(JSON.parse(content));
  } catch (err: any) {
    res.status(500).json({ error: "Failed to read interfaz.json", details: err.message });
  }
});

// --- SQLite Database Relational Endpoints ---

// Get all stores from SQLite
app.get("/api/stores", async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT * FROM stores ORDER BY name ASC");
    if (!result[0] || !result[0].values) {
      return res.json([]);
    }
    const stores = result[0].values.map(rowToStore);
    res.json(stores);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a store in SQLite
app.post("/api/stores", async (req, res) => {
  try {
    const store = req.body;
    if (!store || !store.id) {
      return res.status(400).json({ error: "Store object with valid id is required" });
    }
    const db = await getDb();
    saveStoreToDb(db, store);
    persistDb();
    res.json({ success: true, store });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a store from SQLite
app.delete("/api/stores/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run("DELETE FROM stores WHERE id = $id", { "$id": id });
    db.run("DELETE FROM products WHERE storeId = $storeId", { "$storeId": id });
    persistDb();
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get all products from SQLite
app.get("/api/products", async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT * FROM products ORDER BY createdAt DESC");
    if (!result[0] || !result[0].values) {
      return res.json([]);
    }
    const columns = result[0].columns;
    const products = result[0].values.map(row => rowToProduct(row, columns));
    res.json(products);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create or update a product in SQLite
app.post("/api/products", async (req, res) => {
  try {
    const product = req.body;
    if (!product || !product.id) {
      return res.status(400).json({ error: "Product object with valid id is required" });
    }
    const db = await getDb();
    const candidateCode = (product.code || '').trim().toUpperCase();
    if (candidateCode) {
      const checkRes = db.exec("SELECT id FROM products WHERE UPPER(code) = $code AND id != $id", {
        "$code": candidateCode,
        "$id": product.id
      });
      if (checkRes[0]?.values && checkRes[0].values.length > 0) {
        return res.status(400).json({ error: `El código "${candidateCode}" ya está en uso por otro producto. Debe ser único.` });
      }
      product.code = candidateCode;
    }
    saveProductToDb(db, product);
    persistDb();
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a product from SQLite
app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    db.run("DELETE FROM products WHERE id = $id", { "$id": id });
    persistDb();
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get marketplace configuration from SQLite
app.get("/api/config", async (req, res) => {
  try {
    const db = await getDb();
    const result = db.exec("SELECT * FROM marketplace_config WHERE id = 'default'");
    if (!result[0] || !result[0].values || !result[0].values[0]) {
      return res.json({});
    }
    const config = rowToConfig(result[0].values[0]);
    res.json(config);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update marketplace configuration in SQLite
app.post("/api/config", async (req, res) => {
  try {
    const config = req.body;
    const db = await getDb();
    saveConfigToDb(db, config);
    persistDb();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore / Bulk import to SQLite
app.post("/api/db/restore", async (req, res) => {
  try {
    const { stores, products, config } = req.body;
    const db = await getDb();

    if (Array.isArray(stores)) {
      db.run("DELETE FROM stores");
      for (const st of stores) {
        saveStoreToDb(db, st);
      }
    }

    if (Array.isArray(products)) {
      db.run("DELETE FROM products");
      for (const pr of products) {
        saveProductToDb(db, pr);
      }
    }

    if (config) {
      saveConfigToDb(db, config);
    }

    persistDb();
    res.json({ success: true, message: "Base de datos SQLite restaurada correctamente" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});



// Vite middleware for development or static serving for production
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🇨🇺 MercadoCuba Server running on http://localhost:${PORT}`);
  });
}

setupServer();
