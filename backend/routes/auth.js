const express = require("express");
const app = express();
const authRoutes = require("./routes/auth");

app.use(express.json());

// Habilitar CORS se necessário (exemplo)
const cors = require("cors");
app.use(cors());

// Usar as rotas de autenticação prefixadas com /api/auth, por exemplo
app.use("/api/auth", authRoutes);

// Porta e start do servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
