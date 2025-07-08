import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "gestao_vendas",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, params) {
  try {
    const [rows] = await pool.execute(sql, params || []);
    return rows;
  } catch (error) {
    console.error("Erro na query SQL:", error);
    throw error;
  }
}

function cryptoRandomUUID() {
  try {
    return randomUUID();
  } catch {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

// --- LOGIN ---
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "E-mail e senha são obrigatórios." });

    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    if (!users.length) return res.status(401).json({ message: "E-mail ou senha inválidos." });

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "E-mail ou senha inválidos." });

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "segredo",
      { expiresIn: "1d" }
    );

    delete user.password;
    return res.status(200).json({ token, user });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
});

// --- USUÁRIOS ---
// Cadastrar novo usuário
app.post("/api/users", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Campos name, email, password e role são obrigatórios." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = cryptoRandomUUID();
    await query(
      "INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [id, name, email, hashedPassword, role]
    );
    const novoUsuario = await query("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [id]);
    return res.status(201).json(novoUsuario[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }
    console.error("Erro ao criar usuário:", error);
    return res.status(500).json({ message: "Erro ao criar usuário." });
  }
});

// Buscar todos os usuários
app.get("/api/users", async (req, res) => {
  try {
    const users = await query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({ message: "Erro ao buscar usuários." });
  }
});

// Buscar usuário por ID
app.get("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const users = await query("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [id]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    return res.status(200).json(users[0]);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return res.status(500).json({ message: "Erro ao buscar usuário." });
  }
});

// Atualizar usuário
app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: "Campos name, email e role são obrigatórios." });
    }

    let updateFields = ["name = ?", "email = ?", "role = ?"];
    const values = [name, email, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    values.push(id);

    const result = await query(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const usuarioAtualizado = await query("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [id]);
    return res.status(200).json(usuarioAtualizado[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "E-mail já cadastrado." });
    }
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ message: "Erro ao atualizar usuário." });
  }
});

// Remover usuário
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await query("SELECT * FROM users WHERE id = ?", [id]);
    if (usuario.length === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    const vendas = await query("SELECT COUNT(*) as total FROM sales WHERE seller_id = ?", [id]);
    if (vendas[0].total > 0) {
      return res.status(400).json({
        message: "Não é possível excluir o usuário porque ele possui vendas registradas."
      });
    }

    const result = await query("DELETE FROM users WHERE id = ?", [id]);
    return res.status(200).json({ message: "Usuário removido com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return res.status(500).json({ message: "Erro ao deletar usuário." });
  }
});

// --- PRODUTOS ---
app.get("/api/products", async (req, res) => {
  try {
    const products = await query("SELECT * FROM products ORDER BY name");
    return res.status(200).json(products);
  } catch (error) {
    console.error("Erro ao buscar produtos:", error);
    return res.status(500).json({ message: "Erro ao buscar produtos." });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { code, name, category, price, stock, min_stock } = req.body;
    if (!code || !name || price == null || stock == null || min_stock == null)
      return res.status(400).json({ message: "Campos obrigatórios faltando." });

    const id = cryptoRandomUUID();
    await query(
      "INSERT INTO products (id, code, name, category, price, stock, min_stock) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, code, name, category || "", parseFloat(price), parseInt(stock), parseInt(min_stock)]
    );

    const novoProduto = await query("SELECT * FROM products WHERE id = ?", [id]);
    return res.status(201).json(novoProduto[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "Código do produto já existe." });
    }
    console.error("Erro ao cadastrar produto:", error);
    return res.status(500).json({ message: "Erro ao cadastrar produto." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, category, price, stock, min_stock } = req.body;

    if (!code || !name || price == null || stock == null || min_stock == null)
      return res.status(400).json({ message: "Campos obrigatórios faltando." });

    const result = await query(
      "UPDATE products SET code = ?, name = ?, category = ?, price = ?, stock = ?, min_stock = ? WHERE id = ?",
      [code, name, category || "", parseFloat(price), parseInt(stock), parseInt(min_stock), id]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Produto não encontrado." });

    const produtoAtualizado = await query("SELECT * FROM products WHERE id = ?", [id]);
    return res.status(200).json(produtoAtualizado[0]);
  } catch (error) {
    console.error("Erro ao atualizar produto:", error);
    return res.status(500).json({ message: "Erro ao atualizar produto." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM products WHERE id = ?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Produto não encontrado." });

    return res.status(200).json({ message: "Produto excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir produto:", error);
    return res.status(500).json({ message: "Erro ao excluir produto." });
  }
});

app.patch("/api/products/:id/stock", async (req, res) => {
  try {
    const { id } = req.params;
    const { type, quantity } = req.body;

    if (!["in", "out"].includes(type))
      return res.status(400).json({ message: "Tipo de movimentação inválido." });

    const quantityNum = parseInt(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0)
      return res.status(400).json({ message: "Quantidade inválida." });

    const produtos = await query("SELECT * FROM products WHERE id = ?", [id]);
    if (!produtos.length)
      return res.status(404).json({ message: "Produto não encontrado." });

    const produto = produtos[0];
    let novoEstoque = type === "in" ? produto.stock + quantityNum : produto.stock - quantityNum;
    if (novoEstoque < 0) novoEstoque = 0;

    await query("UPDATE products SET stock = ? WHERE id = ?", [novoEstoque, id]);
    await query(
      "INSERT INTO stock_movements (id, product_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)",
      [cryptoRandomUUID(), id, type, quantityNum, type === "in" ? "Entrada manual" : "Saída manual"]
    );

    return res.status(200).json({ message: "Estoque atualizado.", stock: novoEstoque });
  } catch (error) {
    console.error("Erro ao atualizar estoque:", error);
    return res.status(500).json({ message: "Erro ao atualizar estoque." });
  }
});

// --- DASHBOARD ---
app.get("/api/dashboard", async (req, res) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const [salesData, categoryData] = await Promise.all([
      query(
        `SELECT DATE_FORMAT(sale_date, '%Y-%m-%d') as date, SUM(total) as total 
         FROM sales 
         WHERE sale_date BETWEEN ? AND ?
         GROUP BY DATE(sale_date) 
         ORDER BY sale_date ASC`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      ),
      query(
        `SELECT p.category, SUM(s.total) as total
         FROM sales s
         JOIN products p ON s.product_id = p.id
         WHERE s.sale_date BETWEEN ? AND ?
         GROUP BY p.category`,
        [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      )
    ]);

    const dateLabels = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      dateLabels.push(date.toLocaleDateString('pt-BR', { weekday: 'short' }));
    }

    const salesByDay = Array(7).fill(0);
    salesData.forEach(sale => {
      const saleDate = new Date(sale.date);
      const dayIndex = Math.floor((saleDate - startDate) / (1000 * 60 * 60 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        salesByDay[dayIndex] = parseFloat(sale.total);
      }
    });

    const categories = categoryData.map(item => item.category || "Outros");
    const categoryTotals = categoryData.map(item => parseFloat(item.total));

    const summary = await query(
      `SELECT 
         COUNT(*) as totalSales, 
         SUM(total) as totalRevenue, 
         AVG(total) as averageTicket,
         SUM(total * 0.35) as netProfit
       FROM sales
       WHERE sale_date BETWEEN ? AND ?`,
      [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    const result = {
      totalSales: summary[0].totalSales || 0,
      totalRevenue: parseFloat(summary[0].totalRevenue) || 0,
      averageTicket: parseFloat(summary[0].averageTicket) || 0,
      netProfit: parseFloat(summary[0].netProfit) || 0,
      salesLast7Days: {
        labels: dateLabels,
        data: salesByDay
      },
      salesByCategory: {
        labels: categories,
        data: categoryTotals
      }
    };

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao carregar dashboard:", error);
    return res.status(500).json({ message: "Erro ao carregar dashboard." });
  }
});

// --- CLIENTES ---
app.get("/api/customers", async (req, res) => {
  try {
    const data = await query("SELECT * FROM customers ORDER BY created_at DESC");
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return res.status(500).json({ message: "Erro ao buscar clientes." });
  }
});

app.post("/api/customers", async (req, res) => {
  try {
    const { name, email, phone, cpf_cnpj, address, city, state, postal_code } = req.body;
    const id = cryptoRandomUUID();
    await query(
      "INSERT INTO customers (id, name, email, phone, cpf_cnpj, address, city, state, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [id, name, email, phone, cpf_cnpj, address, city, state, postal_code]
    );
    const cliente = await query("SELECT * FROM customers WHERE id = ?", [id]);
    return res.status(201).json(cliente[0]);
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    return res.status(500).json({ message: "Erro ao cadastrar cliente." });
  }
});

app.put("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, cpf_cnpj, address, city, state, postal_code } = req.body;

    const result = await query(
      `UPDATE customers 
       SET name = ?, email = ?, phone = ?, cpf_cnpj = ?, address = ?, city = ?, state = ?, postal_code = ? 
       WHERE id = ?`,
      [name, email, phone, cpf_cnpj, address, city, state, postal_code, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const clienteAtualizado = await query("SELECT * FROM customers WHERE id = ?", [id]);
    return res.status(200).json(clienteAtualizado[0]);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return res.status(500).json({ message: "Erro ao salvar cliente." });
  }
});

app.delete("/api/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const cliente = await query("SELECT * FROM customers WHERE id = ?", [id]);
    if (cliente.length === 0) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    const vendas = await query("SELECT COUNT(*) as total FROM sales WHERE customer_id = ?", [id]);
    if (vendas[0].total > 0) {
      return res.status(400).json({
        message: "Não é possível excluir o cliente porque ele possui vendas registradas."
      });
    }

    const result = await query("DELETE FROM customers WHERE id = ?", [id]);
    return res.status(200).json({ message: "Cliente excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    return res.status(500).json({ message: "Erro ao excluir cliente." });
  }
});

// --- VENDAS ---
app.post("/api/sales", async (req, res) => {
  try {
    const { items, paymentMethod, customer_id } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Itens da venda são obrigatórios." });
    }

    const validPaymentMethods = ['dinheiro', 'pix', 'cartao'];
    if (!paymentMethod || !validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: "Método de pagamento inválido." });
    }

    let totalSale = 0;
    const saleDate = new Date().toISOString().split('T')[0];

    for (const item of items) {
      const produto = await query("SELECT * FROM products WHERE id = ?", [item.id]);
      if (!produto || produto.length === 0) {
        return res.status(404).json({ message: `Produto com ID ${item.id} não encontrado.` });
      }
      if (produto[0].stock < item.quantity) {
        return res.status(400).json({ message: `Estoque insuficiente para o produto ${produto[0].name}.` });
      }
      totalSale += produto[0].price * item.quantity;
    }

    for (const item of items) {
      const produto = await query("SELECT * FROM products WHERE id = ?", [item.id]);

      await query(
        `INSERT INTO sales 
        (id, product_id, quantity, price, total, sale_date, customer_id, payment_method) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cryptoRandomUUID(),
          item.id,
          item.quantity,
          produto[0].price,
          produto[0].price * item.quantity,
          saleDate,
          customer_id || null,
          paymentMethod
        ]
      );

      await query("UPDATE products SET stock = stock - ? WHERE id = ?", [item.quantity, item.id]);

      await query(
        "INSERT INTO stock_movements (id, product_id, type, quantity, description) VALUES (?, ?, ?, ?, ?)",
        [cryptoRandomUUID(), item.id, "out", item.quantity, "Venda realizada"]
      );
    }

    return res.status(201).json({
      message: "Venda registrada com sucesso.",
      total: totalSale,
      date: saleDate
    });
  } catch (error) {
    console.error("Erro ao registrar venda:", error);
    return res.status(500).json({ message: "Erro ao registrar venda." });
  }
});

app.get("/api/sales", async (req, res) => {
  try {
    const { startDate, endDate, paymentMethod } = req.query;

    let sql = `
      SELECT s.*, p.name AS product_name, c.name AS customer_name 
      FROM sales s 
      LEFT JOIN products p ON p.id = s.product_id
      LEFT JOIN customers c ON c.id = s.customer_id
      WHERE 1=1
    `;
    const params = [];

    if (startDate) {
      sql += " AND s.sale_date >= ?";
      params.push(startDate);
    }
    if (endDate) {
      sql += " AND s.sale_date <= ?";
      params.push(endDate);
    }
    if (paymentMethod) {
      sql += " AND s.payment_method = ?";
      params.push(paymentMethod);
    }

    sql += " ORDER BY s.sale_date DESC";

    const data = await query(sql, params);
    return res.status(200).json(data);
  } catch (error) {
    console.error("Erro ao buscar vendas:", error);
    return res.status(500).json({ message: "Erro ao buscar vendas." });
  }
});

// --- HISTÓRICO DE VENDAS ---
app.get("/api/sales/history", async (req, res) => {
  try {
    const { start, end } = req.query;

    if (!start || !end) {
      return res.status(400).json({ error: "Parâmetros start e end são obrigatórios" });
    }

    const sales = await query(
      `SELECT 
         s.*, 
         p.name AS product_name, 
         c.name AS customer_name,
         u.name AS seller_name,
         sm.quantity AS stock_quantity
       FROM sales s
       LEFT JOIN products p ON p.id = s.product_id
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN users u ON u.id = s.seller_id
       LEFT JOIN stock_movements sm ON sm.product_id = s.product_id AND sm.description = 'Venda realizada'
       WHERE s.sale_date BETWEEN ? AND ?
       ORDER BY s.sale_date DESC`,
      [start, `${end} 23:59:59`]
    );

    const formatted = sales.map(sale => ({
      product: sale.product_name,
      quantity: sale.quantity || 1, // Usa a quantidade da venda diretamente
      value: sale.total,
      paymentMethod: sale.payment_method,
      customerName: sale.customer_name || null,
      timestamp: sale.sale_date,
      sellerName: sale.seller_name || "Desconhecido",
    }));

    return res.status(200).json(formatted);
  } catch (error) {
    console.error("Erro ao buscar histórico de vendas:", error);
    return res.status(500).json({ error: "Erro interno ao buscar vendas" });
  }
});

// --- MÉTODOS DE PAGAMENTO ---
app.get("/api/payment-methods", async (req, res) => {
  try {
    const methods = [
      { value: 'dinheiro', label: 'Dinheiro' },
      { value: 'pix', label: 'PIX' },
      { value: 'cartao', label: 'Cartão' }
    ];
    return res.status(200).json(methods);
  } catch (error) {
    console.error("Erro ao buscar métodos de pagamento:", error);
    return res.status(500).json({ message: "Erro ao buscar métodos de pagamento." });
  }
});

// --- FORNECEDORES ---
app.get("/api/suppliers", async (req, res) => {
  try {
    const suppliers = await query("SELECT * FROM suppliers ORDER BY company_name");
    return res.status(200).json(suppliers);
  } catch (error) {
    console.error("Erro ao buscar fornecedores:", error);
    return res.status(500).json({ message: "Erro ao buscar fornecedores." });
  }
});

app.get("/api/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const suppliers = await query("SELECT * FROM suppliers WHERE id = ?", [id]);

    if (suppliers.length === 0) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
    }

    return res.status(200).json(suppliers[0]);
  } catch (error) {
    console.error("Erro ao buscar fornecedor:", error);
    return res.status(500).json({ message: "Erro ao buscar fornecedor." });
  }
});

app.post("/api/suppliers", async (req, res) => {
  try {
    const {
      company_name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      contact_name
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ message: "Razão social é obrigatória." });
    }

    const id = cryptoRandomUUID();
    await query(
      `INSERT INTO suppliers 
      (id, company_name, cnpj, email, phone, address, city, state, contact_name) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, company_name, cnpj || null, email || null, phone || null,
        address || null, city || null, state || null, contact_name || null]
    );

    const novoFornecedor = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
    return res.status(201).json(novoFornecedor[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "CNPJ já cadastrado." });
    }
    console.error("Erro ao cadastrar fornecedor:", error);
    return res.status(500).json({ message: "Erro ao cadastrar fornecedor." });
  }
});

app.put("/api/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      cnpj,
      email,
      phone,
      address,
      city,
      state,
      contact_name
    } = req.body;

    if (!company_name) {
      return res.status(400).json({ message: "Razão social é obrigatória." });
    }

    const result = await query(
      `UPDATE suppliers SET 
        company_name = ?, 
        cnpj = ?, 
        email = ?, 
        phone = ?, 
        address = ?, 
        city = ?, 
        state = ?, 
        contact_name = ? 
      WHERE id = ?`,
      [company_name, cnpj || null, email || null, phone || null,
        address || null, city || null, state || null, contact_name || null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
    }

    const fornecedorAtualizado = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
    return res.status(200).json(fornecedorAtualizado[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ message: "CNPJ já cadastrado." });
    }
    console.error("Erro ao atualizar fornecedor:", error);
    return res.status(500).json({ message: "Erro ao atualizar fornecedor." });
  }
});

app.delete("/api/suppliers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const fornecedor = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
    if (fornecedor.length === 0) {
      return res.status(404).json({ message: "Fornecedor não encontrado." });
    }

    const produtos = await query("SELECT COUNT(*) as count FROM products WHERE supplier_id = ?", [id]);
    if (produtos[0].count > 0) {
      return res.status(400).json({
        message: "Não é possível excluir o fornecedor pois existem produtos associados a ele."
      });
    }

    const result = await query("DELETE FROM suppliers WHERE id = ?", [id]);
    return res.status(200).json({ message: "Fornecedor excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir fornecedor:", error);
    return res.status(500).json({ message: "Erro ao excluir fornecedor." });
  }
});

// --- RELATÓRIOS ---
app.get("/api/reports", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ message: "Datas de início e fim são obrigatórias." });
    }

    const [dailySales, categorySales, topProducts, financialSummary, paymentMethods, stockMovements] = await Promise.all([
      query(
        `SELECT DATE_FORMAT(s.sale_date, '%Y-%m-%d') as label, SUM(s.total) as value 
         FROM sales s 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY DATE(s.sale_date) 
         ORDER BY s.sale_date ASC`,
        [start, end]
      ),
      query(
        `SELECT p.category AS label, SUM(s.total) AS value 
         FROM sales s 
         JOIN products p ON s.product_id = p.id 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY p.category`,
        [start, end]
      ),
      query(
        `SELECT p.name AS label, COUNT(*) AS value 
         FROM sales s 
         JOIN products p ON s.product_id = p.id 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY p.name 
         ORDER BY value DESC 
         LIMIT 5`,
        [start, end]
      ),
      (async () => {
        const currentResult = await query(
          `SELECT
             SUM(s.total) AS totalRevenue,
             AVG(s.total) AS averageTicket,
             COUNT(*) AS totalSales,
             SUM(s.total * 0.35) AS netProfit
           FROM sales s 
           WHERE s.sale_date BETWEEN ? AND ?`,
          [start, end]
        );

        const previousResult = await query(
          `SELECT
             SUM(s.total) AS totalRevenue,
             AVG(s.total) AS averageTicket,
             COUNT(*) AS totalSales,
             SUM(s.total * 0.35) AS netProfit
           FROM sales s 
           WHERE s.sale_date BETWEEN DATE_SUB(?, INTERVAL DATEDIFF(?, ?) DAY) AND ?`,
          [start, end, start, start]
        );

        const current = currentResult[0] || {
          totalRevenue: 0,
          averageTicket: 0,
          totalSales: 0,
          netProfit: 0
        };

        const previous = previousResult[0] || {
          totalRevenue: 0,
          averageTicket: 0,
          totalSales: 0,
          netProfit: 0
        };

        const calculateGrowth = (currentVal, previousVal) => {
          if (!previousVal || previousVal === 0) return 100;
          return +(((currentVal - previousVal) / previousVal) * 100).toFixed(2);
        };

        return {
          totalRevenue: +current.totalRevenue || 0,
          averageTicket: +current.averageTicket || 0,
          totalSales: +current.totalSales || 0,
          netProfit: +current.netProfit || 0,
          growthRevenuePercent: calculateGrowth(+current.totalRevenue, +previous.totalRevenue),
          growthTicketPercent: calculateGrowth(+current.averageTicket, +previous.averageTicket),
          growthSalesPercent: calculateGrowth(+current.totalSales, +previous.totalSales),
          growthProfitPercent: calculateGrowth(+current.netProfit, +previous.netProfit),
        };
      })(),
      query(
        `SELECT payment_method, SUM(total) as total 
         FROM sales 
         WHERE sale_date BETWEEN ? AND ?
         GROUP BY payment_method`,
        [start, end]
      ),
      query(
        `SELECT sm.type AS label, SUM(sm.quantity) AS value 
         FROM stock_movements sm 
         WHERE sm.created_at BETWEEN ? AND ? 
         GROUP BY sm.type`,
        [start, end]
      )
    ]);

    return res.status(200).json({
      dailySales: {
        labels: dailySales.map((r) => r.label),
        data: dailySales.map((r) => +r.value),
      },
      categorySales: {
        labels: categorySales.map((r) => r.label || "Sem Categoria"),
        data: categorySales.map((r) => +r.value),
      },
      topProducts: {
        labels: topProducts.map((r) => r.label),
        data: topProducts.map((r) => +r.value),
      },
      paymentMethods: {
        labels: paymentMethods.map((r) => r.payment_method),
        data: paymentMethods.map((r) => +r.total),
      },
      stockMovements: {
        labels: stockMovements.map((r) => r.label),
        data: stockMovements.map((r) => +r.value),
      },
      financialSummary,
    });
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    return res.status(500).json({ message: "Erro ao gerar relatório." });
  }
});

// --- EXPORTAÇÃO DE RELATÓRIOS ---
app.get("/api/reports/export", async (req, res) => {
  try {
    const { start, end, format } = req.query;
    if (!start || !end || !['pdf', 'xlsx'].includes(format)) {
      return res.status(400).json({ message: "Parâmetros inválidos." });
    }

    const [dailySales, categorySales, topProducts, financialSummary, paymentMethods, stockMovements] = await Promise.all([
      query(
        `SELECT DATE_FORMAT(s.sale_date, '%Y-%m-%d') as label, SUM(s.total) as value 
         FROM sales s 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY DATE(s.sale_date) 
         ORDER BY s.sale_date ASC`,
        [start, end]
      ),
      query(
        `SELECT p.category AS label, SUM(s.total) AS value 
         FROM sales s 
         JOIN products p ON s.product_id = p.id 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY p.category`,
        [start, end]
      ),
      query(
        `SELECT p.name AS label, COUNT(*) AS value 
         FROM sales s 
         JOIN products p ON s.product_id = p.id 
         WHERE s.sale_date BETWEEN ? AND ? 
         GROUP BY p.name 
         ORDER BY value DESC 
         LIMIT 5`,
        [start, end]
      ),
      query(
        `SELECT
           SUM(s.total) AS totalRevenue,
           AVG(s.total) AS averageTicket,
           COUNT(*) AS totalSales,
           SUM(s.total * 0.35) AS netProfit
         FROM sales s 
         WHERE s.sale_date BETWEEN ? AND ?`,
        [start, end]
      ),
      query(
        `SELECT payment_method, SUM(total) as total 
         FROM sales 
         WHERE sale_date BETWEEN ? AND ?
         GROUP BY payment_method`,
        [start, end]
      ),
      query(
        `SELECT sm.type AS label, SUM(sm.quantity) AS value 
         FROM stock_movements sm 
         WHERE sm.created_at BETWEEN ? AND ? 
         GROUP BY sm.type`,
        [start, end]
      )
    ]);

    //convertendo e tratando erros para não ser null e gerar erros
    const totalRevenue = Number(financialSummary[0].totalRevenue) || 0;
    const averageTicket = Number(financialSummary[0].averageTicket) || 0;
    const totalSales = Number(financialSummary[0].totalSales) || 0;
    const netProfit = Number(financialSummary[0].netProfit) || 0;

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_vendas_${start}_a_${end}.pdf`);
      doc.pipe(res);

      doc.fontSize(16).text('Relatório de Vendas', { align: 'center' });
      doc.fontSize(12).text(`Período: ${start} até ${end}`, { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).text('Resumo Financeiro');
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Faturamento Total: R$ ${totalRevenue.toFixed(2)}`);
      doc.text(`Ticket Médio: R$ ${averageTicket.toFixed(2)}`);
      doc.text(`Total de Vendas: ${totalSales}`);
      doc.text(`Lucro Líquido: R$ ${netProfit.toFixed(2)}`);
      doc.moveDown();

      doc.fontSize(14).text('Vendas por Período');
      doc.moveDown(0.5);
      doc.fontSize(10);
      dailySales.forEach((sale) => {
        const value = Number(sale.value) || 0;
        doc.text(`${sale.label}: R$ ${value.toFixed(2)}`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Vendas por Categoria');
      doc.moveDown(0.5);
      categorySales.forEach((cat) => {
        const value = Number(cat.value) || 0;
        doc.text(`${cat.label || 'Sem Categoria'}: R$ ${value.toFixed(2)}`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Produtos Mais Vendidos');
      doc.moveDown(0.5);
      topProducts.forEach((prod) => {
        const value = Number(prod.value) || 0;
        doc.text(`${prod.label}: ${value} unidades`);
      });
      doc.moveDown();

      doc.fontSize(14).text('Movimentações de Estoque');
      doc.moveDown(0.5);
      stockMovements.forEach((mov) => {
        const value = Number(mov.value) || 0;
        doc.text(`${mov.label}: ${value} unidades`);
      });

      doc.end();
    } else if (format === 'xlsx') {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatório de Vendas');

      worksheet.mergeCells('A1:B1');
      worksheet.getCell('A1').value = 'Relatório de Vendas';
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A2:B2');
      worksheet.getCell('A2').value = `Período: ${start} até ${end}`;
      worksheet.getCell('A2').alignment = { horizontal: 'center' };
      worksheet.addRow([]);

      worksheet.addRow(['Resumo Financeiro']);
      worksheet.getCell('A3').font = { bold: true, size: 14 };
      worksheet.addRow(['Faturamento Total', `R$ ${totalRevenue.toFixed(2)}`]);
      worksheet.addRow(['Ticket Médio', `R$ ${averageTicket.toFixed(2)}`]);
      worksheet.addRow(['Total de Vendas', totalSales]);
      worksheet.addRow(['Lucro Líquido', `R$ ${netProfit.toFixed(2)}`]);
      worksheet.addRow([]);

      worksheet.addRow(['Vendas por Período']);
      worksheet.getCell('A8').font = { bold: true, size: 14 };
      worksheet.addRow(['Data', 'Valor']);
      dailySales.forEach((sale) => {
        const value = Number(sale.value) || 0;
        worksheet.addRow([sale.label, value]);
      });
      worksheet.addRow([]);

      worksheet.addRow(['Vendas por Categoria']);
      worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
      worksheet.addRow(['Categoria', 'Valor']);
      categorySales.forEach((cat) => {
        const value = Number(cat.value) || 0;
        worksheet.addRow([cat.label || 'Sem Categoria', value]);
      });
      worksheet.addRow([]);

      worksheet.addRow(['Produtos Mais Vendidos']);
      worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
      worksheet.addRow(['Produto', 'Unidades Vendidas']);
      topProducts.forEach((prod) => {
        const value = Number(prod.value) || 0;
        worksheet.addRow([prod.label, value]);
      });
      worksheet.addRow([]);

      worksheet.addRow(['Movimentações de Estoque']);
      worksheet.getCell(`A${worksheet.rowCount}`).font = { bold: true, size: 14 };
      worksheet.addRow(['Tipo', 'Quantidade']);
      stockMovements.forEach((mov) => {
        const value = Number(mov.value) || 0;
        worksheet.addRow([mov.label, value]);
      });

      worksheet.columns.forEach((column) => {
        column.width = 25;
        column.alignment = { horizontal: 'left' };
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=relatorio_vendas_${start}_a_${end}.xlsx`);

      await workbook.xlsx.writeBuffer().then((buffer) => {
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);
      });
    }
  } catch (error) {
    console.error("Erro ao exportar relatório:", error);
    return res.status(500).json({ message: "Erro ao exportar relatório." });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em: http://localhost:${PORT}`);
});
