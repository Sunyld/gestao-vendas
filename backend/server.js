import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import inventoryRoutes from "./routes/inventory.js";
import customersRoutes from "./routes/customers.js";
import salesRoutes from "./routes/sales.js";
import suppliersRoutes from "./routes/suppliers.js";
import reportsRoutes from "./routes/reports.js";
import settingsRoutes from "./routes/settings.js";
import { query } from "./utils/db.js";
import pool from "./db.js";
import reportsController from "./controllers/reportsController.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Mount routers preserving URLs
app.use("/", authRoutes); // POST /login
app.use("/api/users", usersRoutes);
app.use("/api/products", inventoryRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/suppliers", suppliersRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api", settingsRoutes); // GET /api/payment-methods

// Compat: rota direta para dashboard
app.get("/api/dashboard", reportsController.dashboard);

// Garantias automáticas de schema para evitar erros em produção
async function ensureSalesSchema() {
  try {
    // Tenta adicionar colunas; ignora se já existirem
    try { await pool.query("ALTER TABLE sales ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER quantity"); } catch (e) { if (e?.code !== 'ER_DUP_FIELDNAME') throw e; }
    try { await pool.query("ALTER TABLE sales ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER price"); } catch (e) { if (e?.code !== 'ER_DUP_FIELDNAME') throw e; }
    try { await pool.query("ALTER TABLE sales ADD COLUMN sale_id VARCHAR(36) NULL AFTER id"); } catch (e) { if (e?.code !== 'ER_DUP_FIELDNAME') throw e; }
    try { await pool.query("ALTER TABLE sales ADD COLUMN returned TINYINT(1) NOT NULL DEFAULT 0 AFTER payment_method"); } catch (e) { if (e?.code !== 'ER_DUP_FIELDNAME') throw e; }
    // Índice; ignora se já existir
    try { await pool.query("CREATE INDEX idx_sale_id ON sales (sale_id)"); } catch (e) { if (!['ER_DUP_KEYNAME','ER_CANT_CREATE_TABLE','ER_DUP_INDEX'].includes(e?.code || '')) { throw e; } }
    console.log("✅ Verificação de schema de sales concluída");
  } catch (err) {
    console.error("⚠️ Falha ao garantir schema de sales:", err?.message || err);
  }
}

ensureSalesSchema();

// 404 handler padronizado
app.use((req, res) => {
  return res.status(404).json({ message: "Rota não encontrada" });
});

// Error handler padronizado
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Erro inesperado:", err);
  const status = err.statusCode || 500;
  const message = err.message || "Erro interno no servidor";
  return res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});


