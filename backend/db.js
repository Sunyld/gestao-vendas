import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_USER = process.env.DB_USER || "root";
const DB_PASSWORD = process.env.DB_PASSWORD || "";
const DB_NAME = process.env.DB_NAME || "gestao_vendas";

console.log("🔧 Criando pool de conexões MySQL com:");
console.log("Host:", DB_HOST);
console.log("User:", DB_USER);
console.log("Password:", DB_PASSWORD ? "(definido)" : "(vazio)");
console.log("Database:", DB_NAME);

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
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
