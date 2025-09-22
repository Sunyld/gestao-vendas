import bcrypt from "bcrypt";
import { query, cryptoRandomUUID } from "../utils/db.js";

const usersController = {
  createUser: async (req, res) => {
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
  },

  getUsers: async (_req, res) => {
    try {
      const users = await query("SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC");
      return res.status(200).json(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      return res.status(500).json({ message: "Erro ao buscar usuários." });
    }
  },

  getUserById: async (req, res) => {
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
  },

  updateUser: async (req, res) => {
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
  },

  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;

      const usuario = await query("SELECT * FROM users WHERE id = ?", [id]);
      if (usuario.length === 0) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }

      const vendas = await query("SELECT COUNT(*) as total FROM sales WHERE seller_id = ?", [id]);
      if (vendas[0].total > 0) {
        return res.status(400).json({
          message: "Não é possível excluir o usuário porque ele possui vendas registradas.",
        });
      }

      await query("DELETE FROM users WHERE id = ?", [id]);
      return res.status(200).json({ message: "Usuário removido com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return res.status(500).json({ message: "Erro ao deletar usuário." });
    }
  },
};

export default usersController;


