const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "E-mail e senha são obrigatórios." });

    // Promisify db.query (caso não retorne Promise)
    const query = (sql, params) =>
      new Promise((resolve, reject) => {
        db.query(sql, params, (err, results) => {
          if (err) reject(err);
          else resolve(results);
        });
      });

    const results = await query("SELECT * FROM users WHERE email = ?", [email]);

    if (results.length === 0)
      return res.status(401).json({ message: "Usuário não encontrado." });

    const user = results[0];

    const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) return res.status(401).json({ message: "Senha incorreta." });

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET não definido no .env");
      return res.status(500).json({ message: "Erro interno no servidor." });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  }
};
