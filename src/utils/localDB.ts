// src/utils/localDB.ts
import Dexie, { Table } from "dexie";

export interface Venda {
  id?: number;
  produto: string;
  quantidade: number;
  preco: number;
  data: string;
}

class AppDB extends Dexie {
  vendas!: Table<Venda, number>;

  constructor() {
    super("GestaoVendasDB");
    this.version(1).stores({
      vendas: "++id, produto, data" // indexação
    });
  }
}

export const db = new AppDB();
