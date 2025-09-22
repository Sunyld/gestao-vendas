import { query, cryptoRandomUUID } from "../utils/db.js";

const suppliersController = {
  list: async (_req, res) => {
    try {
      const suppliers = await query("SELECT * FROM suppliers ORDER BY company_name");
      return res.status(200).json(suppliers);
    } catch (error) {
      console.error("Erro ao buscar fornecedores:", error);
      return res.status(500).json({ message: "Erro ao buscar fornecedores." });
    }
  },

  getById: async (req, res) => {
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
  },

  create: async (req, res) => {
    try {
      const { company_name, cnpj, email, phone, address, city, state, contact_name } = req.body;
      if (!company_name) {
        return res.status(400).json({ message: "Razão social é obrigatória." });
      }
      const id = cryptoRandomUUID();
      await query(
        `INSERT INTO suppliers 
        (id, company_name, cnpj, email, phone, address, city, state, contact_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, company_name, cnpj || null, email || null, phone || null, address || null, city || null, state || null, contact_name || null]
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
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { company_name, cnpj, email, phone, address, city, state, contact_name } = req.body;
      if (!company_name) {
        return res.status(400).json({ message: "Razão social é obrigatória." });
      }
      const result = await query(
        `UPDATE suppliers SET 
          company_name = ?, cnpj = ?, email = ?, phone = ?, address = ?, city = ?, state = ?, contact_name = ? 
        WHERE id = ?`,
        [company_name, cnpj || null, email || null, phone || null, address || null, city || null, state || null, contact_name || null, id]
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
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;
      const fornecedor = await query("SELECT * FROM suppliers WHERE id = ?", [id]);
      if (fornecedor.length === 0) {
        return res.status(404).json({ message: "Fornecedor não encontrado." });
      }
      const produtos = await query("SELECT COUNT(*) as count FROM products WHERE supplier_id = ?", [id]);
      if (produtos[0].count > 0) {
        return res.status(400).json({ message: "Não é possível excluir o fornecedor pois existem produtos associados a ele." });
      }
      await query("DELETE FROM suppliers WHERE id = ?", [id]);
      return res.status(200).json({ message: "Fornecedor excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir fornecedor:", error);
      return res.status(500).json({ message: "Erro ao excluir fornecedor." });
    }
  },
};

export default suppliersController;


