import { query, cryptoRandomUUID } from "../utils/db.js";

const salesController = {
  createSale: async (req, res) => {
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
      const saleId = cryptoRandomUUID();

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
          (id, sale_id, product_id, quantity, price, total, sale_date, customer_id, payment_method) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            cryptoRandomUUID(),
            saleId,
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
        date: saleDate,
        sale_id: saleId
      });
    } catch (error) {
      console.error("Erro ao registrar venda:", error);
      return res.status(500).json({ message: "Erro ao registrar venda." });
    }
  },

  listSales: async (req, res) => {
    try {
      const { startDate, endDate, paymentMethod } = req.query;

      let sql = `
        SELECT s.*, p.name AS product_name, c.name AS customer_name 
        FROM sales s 
        LEFT JOIN products p ON p.id = s.product_id
        LEFT JOIN customers c ON c.id = s.customer_id
        WHERE 1=1 AND s.returned = 0
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
  },

  salesHistory: async (req, res) => {
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
         WHERE s.sale_date BETWEEN ? AND ? AND s.returned = 0
         ORDER BY s.sale_date DESC`,
        [start, `${end} 23:59:59`]
      );

      const formatted = sales.map(sale => ({
        product: sale.product_name,
        quantity: sale.quantity || 1,
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
  },

  // Lista de vendas concluídas (resumo por sale_id)
  listCompletedSales: async (req, res) => {
    try {
      const sql = `
        SELECT sale_id,
               MIN(sale_date) AS date,
               SUM(total) AS total,
               MIN(payment_method) AS payment_method,
               MIN(customer_id) AS customer_id
        FROM sales
        WHERE returned = 0
        GROUP BY sale_id
        ORDER BY date DESC`;
      const rows = await query(sql);
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Erro ao listar vendas concluídas:", error);
      return res.status(500).json({ message: "Erro ao listar vendas." });
    }
  },

  // Devolução: repõe estoque e registra movimento inverso
  returnSale: async (req, res) => {
    try {
      const { saleId } = req.params;
      const items = await query("SELECT * FROM sales WHERE sale_id = ?", [saleId]);
      if (!items.length) return res.status(404).json({ message: "Venda não encontrada." });

      for (const row of items) {
        await query("UPDATE products SET stock = stock + ? WHERE id = ?", [row.quantity, row.product_id]);
        await query(
          "INSERT INTO stock_movements (id, product_id, type, quantity, description) VALUES (?, ?, 'in', ?, ?)",
          [cryptoRandomUUID(), row.product_id, row.quantity, `Devolução da venda ${saleId}`]
        );
      }
      await query("UPDATE sales SET returned = 1 WHERE sale_id = ?", [saleId]);
      return res.status(200).json({ message: "Devolução realizada e estoque atualizado." });
    } catch (error) {
      console.error("Erro na devolução:", error);
      return res.status(500).json({ message: "Erro ao processar devolução." });
    }
  },
};

export default salesController;


