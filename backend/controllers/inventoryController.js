import { query, cryptoRandomUUID } from "../utils/db.js";

const inventoryController = {
  listProducts: async (_req, res) => {
    try {
      const products = await query("SELECT * FROM products ORDER BY name");
      return res.status(200).json(products);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      return res.status(500).json({ message: "Erro ao buscar produtos." });
    }
  },

  createProduct: async (req, res) => {
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
  },

  updateProduct: async (req, res) => {
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
  },

  deleteProduct: async (req, res) => {
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
  },

  patchStock: async (req, res) => {
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
  },
};

export default inventoryController;


