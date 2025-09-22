import { randomUUID } from "crypto";
import pool from "../db.js";

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

export function cryptoRandomUUID() {
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

export default { query, cryptoRandomUUID };


