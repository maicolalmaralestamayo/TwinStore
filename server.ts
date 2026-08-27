import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
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
    const interfazPath = path.join(process.cwd(), "interfaz.json");
    const fallbackPath = path.join(process.cwd(), "src", "data", "interfaz.json");
    const targetPath = fs.existsSync(interfazPath) ? interfazPath : fallbackPath;
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
    const products = result[0].values.map(rowToProduct);
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

// API route: AI Assistant to enhance Cuban marketplace product titles, descriptions & tags
app.post("/api/ai/enhance-product", async (req, res) => {
  try {
    const { title, description, category, priceUSD, storeName } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    // Check if API key is present
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      // Graceful fallback if user has not set GEMINI_API_KEY yet in AI Studio settings
      return res.json({
        success: true,
        enhancedTitle: title ? `${title.trim()} | Calidad y Entrega Segura` : "Producto de Calidad en Cuba",
        enhancedDescription: description
          ? `${description.trim()}\n\n✅ Excelente calidad para el hogar o negocio.\n✅ Contacte al vendedor por WhatsApp para coordinar entrega o recogida en ${storeName || "La Habana/Cuba"}.\n✅ Garantía de seriedad y trato directo.`
          : `Excelente producto en la categoría ${category || "General"}. Disponible para entrega inmediata o coordinación por WhatsApp en ${storeName || "Cuba"}. Trato directo sin intermediarios.`,
        suggestedTags: ["cuba", "disponible", "whatsapp", category?.toLowerCase() || "oferta", "calidad"].filter(Boolean),
        note: "Sugerencia generada localmente (Configure GEMINI_API_KEY en Secretos para IA avanzada)."
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Eres un experto redactor de comercio y ventas en el mercado de Cuba ("MercadoCuba").
Necesitamos optimizar un producto o servicio que se ofrecerá en un marketplace donde las ventas se concretan por WhatsApp directamente entre cliente y vendedor.

Datos actuales del producto:
- Título: "${title || "Sin título"}"
- Descripción actual: "${description || "Sin descripción"}"
- Categoría: "${category || "Varios"}"
- Precio estimado en USD: $${priceUSD || 0}
- Tienda/Proveedor: "${storeName || "Tienda en Cuba"}"

Instrucciones:
1. "enhancedTitle": Crea un título atractivo, claro y corto (máximo 60 caracteres), propio de comercio cubano.
2. "enhancedDescription": Crea una descripción comercial persuasiva y clara en español (máximo 120 palabras), destacando utilidad, estado y que la compra se acuerda en WhatsApp con el vendedor sin comisiones ni esperas.
3. "suggestedTags": Devuelve un array con 4 a 6 etiquetas (tags) breves en minúsculas relevantes para el motor de búsqueda.

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta:
{
  "enhancedTitle": "...",
  "enhancedDescription": "...",
  "suggestedTags": ["tag1", "tag2", "tag3", "tag4"]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      enhancedTitle: parsed.enhancedTitle || title,
      enhancedDescription: parsed.enhancedDescription || description,
      suggestedTags: parsed.suggestedTags || ["cuba", "oferta", "whatsapp", "calidad"],
      note: "Generado con Inteligencia Artificial Gemini."
    });
  } catch (error: any) {
    console.error("Error in /api/ai/enhance-product:", error);
    return res.status(500).json({
      success: false,
      error: "Error al generar recomendación con IA",
      details: error?.message
    });
  }
});

// API route: AI Assistant to suggest WhatsApp responses for Cuban store owners
app.post("/api/ai/whatsapp-reply", async (req, res) => {
  try {
    const { storeName, productName, priceUSD, priceCUP, customerMessage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.json({
        success: true,
        suggestions: [
          `¡Hola! Sí, tenemos disponible el ${productName}. El precio es $${priceUSD} USD o ${priceCUP} CUP al cambio de hoy. ¿En qué zona de Cuba se encuentra para la entrega?`,
          `¡Buenas! Con gusto le atiendo desde ${storeName}. El ${productName} está disponible. Aceptamos efectivo en USD, MLC o CUP (${priceCUP} CUP). ¿Desea coordinar envío o recogida?`,
          `¡Hola! Gracias por contactarnos por MercadoCuba. Nos queda en existencia el ${productName}. Dígame si necesita algún detalle adicional o foto real.`
        ]
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
Eres un asistente para vendedores en Cuba que usan WhatsApp para cerrar ventas en "MercadoCuba".
Un cliente te ha escrito o está preguntando por un producto.

Datos de la tienda: ${storeName || "Mi Tienda en Cuba"}
Producto: ${productName || "Producto"}
Precio: $${priceUSD} USD / ${priceCUP} CUP

Genera 3 opciones cortas, amables y profesionales de respuesta para enviar por WhatsApp al cliente en Cuba.
Responde ÚNICAMENTE en formato JSON con un array de strings:
{
  "suggestions": [
    "Opción 1...",
    "Opción 2...",
    "Opción 3..."
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);

    return res.json({
      success: true,
      suggestions: parsed.suggestions || []
    });
  } catch (error: any) {
    console.error("Error in /api/ai/whatsapp-reply:", error);
    return res.status(500).json({
      success: false,
      error: "Error al generar respuestas con IA"
    });
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
