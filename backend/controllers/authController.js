import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../utils/db.js";

const authController = {
  login: async (req, res) => {
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
  },
};

export default authController;
 
