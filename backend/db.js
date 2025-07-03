import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

console.log("🔧 Criando pool de conexões MySQL com:");
console.log("Host:", process.env.DB_HOST);
console.log("User:", process.env.DB_USER);
console.log("Password:", process.env.DB_PASSWORD ? "(definido)" : "(vazio)");
console.log("Database:", process.env.DB_NAME);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection()
  .then(() => console.log("✅ Pool de conexões MySQL criado e funcionando!"))
  .catch((err) => {
    console.error("❌ Erro ao criar pool de conexões MySQL:", err.message);
    process.exit(1); // encerra app se não conseguir conectar
  });

export default pool;
