import { query, cryptoRandomUUID } from "../utils/db.js";

const customersController = {
  list: async (_req, res) => {
    try {
      const customers = await query("SELECT * FROM customers ORDER BY created_at DESC");
      const vehicles = await query("SELECT * FROM vehicles");
      const items = await query("SELECT * FROM repair_items");

      const vehicleByCustomer = vehicles.reduce((acc, v) => {
        (acc[v.customer_id] = acc[v.customer_id] || []).push({ ...v, items: [] });
        return acc;
      }, {});

      const itemsByVehicle = items.reduce((acc, it) => {
        (acc[it.vehicle_id] = acc[it.vehicle_id] || []).push(it);
        return acc;
      }, {});

      const result = customers.map((c) => {
        const vs = (vehicleByCustomer[c.id] || []).map((v) => ({
          ...v,
          items: itemsByVehicle[v.id] || [],
        }));
        return { ...c, vehicles: vs };
      });

      return res.status(200).json(result);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      return res.status(500).json({ message: "Erro ao buscar clientes." });
    }
  },

  create: async (req, res) => {
    try {
      const { name, email, phone, cpf_cnpj, address, city, state, postal_code } = req.body;
      const id = cryptoRandomUUID();
      await query(
        "INSERT INTO customers (id, name, email, phone, cpf_cnpj, address, city, state, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [id, name, email, phone, cpf_cnpj, address, city, state, postal_code]
      );
      const cliente = await query("SELECT * FROM customers WHERE id = ?", [id]);
      return res.status(201).json({ ...cliente[0], vehicles: [] });
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error);
      return res.status(500).json({ message: "Erro ao cadastrar cliente." });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, email, phone, cpf_cnpj, address, city, state, postal_code } = req.body;

      const result = await query(
        `UPDATE customers 
         SET name = ?, email = ?, phone = ?, cpf_cnpj = ?, address = ?, city = ?, state = ?, postal_code = ? 
         WHERE id = ?`,
        [name, email, phone, cpf_cnpj, address, city, state, postal_code, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }

      const clienteAtualizado = await query("SELECT * FROM customers WHERE id = ?", [id]);
      return res.status(200).json(clienteAtualizado[0]);
    } catch (error) {
      console.error("Erro ao atualizar cliente:", error);
      return res.status(500).json({ message: "Erro ao salvar cliente." });
    }
  },

  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const cliente = await query("SELECT * FROM customers WHERE id = ?", [id]);
      if (cliente.length === 0) {
        return res.status(404).json({ message: "Cliente não encontrado." });
      }

      const vendas = await query("SELECT COUNT(*) as total FROM sales WHERE customer_id = ?", [id]);
      if (vendas[0].total > 0) {
        return res.status(400).json({
          message: "Não é possível excluir o cliente porque ele possui vendas registradas.",
        });
      }

      await query("DELETE FROM customers WHERE id = ?", [id]);
      return res.status(200).json({ message: "Cliente excluído com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      return res.status(500).json({ message: "Erro ao excluir cliente." });
    }
  },

  // Vehicles CRUD
  addVehicle: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { model, plate } = req.body;
      const id = cryptoRandomUUID();
      await query(
        "INSERT INTO vehicles (id, customer_id, model, plate) VALUES (?, ?, ?, ?)",
        [id, customerId, model, plate]
      );
      const vehicle = await query("SELECT * FROM vehicles WHERE id = ?", [id]);
      return res.status(201).json({ ...vehicle[0], items: [] });
    } catch (error) {
      console.error("Erro ao adicionar veículo:", error);
      return res.status(500).json({ message: "Erro ao adicionar veículo." });
    }
  },

  updateVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { model, plate } = req.body;
      const result = await query(
        "UPDATE vehicles SET model = ?, plate = ? WHERE id = ?",
        [model, plate, vehicleId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: "Veículo não encontrado." });
      const vehicle = await query("SELECT * FROM vehicles WHERE id = ?", [vehicleId]);
      return res.status(200).json(vehicle[0]);
    } catch (error) {
      console.error("Erro ao atualizar veículo:", error);
      return res.status(500).json({ message: "Erro ao atualizar veículo." });
    }
  },

  removeVehicle: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      await query("DELETE FROM vehicles WHERE id = ?", [vehicleId]);
      return res.status(200).json({ message: "Veículo removido." });
    } catch (error) {
      console.error("Erro ao remover veículo:", error);
      return res.status(500).json({ message: "Erro ao remover veículo." });
    }
  },

  // Repair items CRUD
  addRepairItem: async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const { description, cost } = req.body;
      const id = cryptoRandomUUID();
      await query(
        "INSERT INTO repair_items (id, vehicle_id, description, cost) VALUES (?, ?, ?, ?)",
        [id, vehicleId, description, cost]
      );
      const item = await query("SELECT * FROM repair_items WHERE id = ?", [id]);
      return res.status(201).json(item[0]);
    } catch (error) {
      console.error("Erro ao adicionar item de reparo:", error);
      return res.status(500).json({ message: "Erro ao adicionar item de reparo." });
    }
  },

  updateRepairItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { description, cost } = req.body;
      const result = await query(
        "UPDATE repair_items SET description = ?, cost = ? WHERE id = ?",
        [description, cost, itemId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: "Item não encontrado." });
      const item = await query("SELECT * FROM repair_items WHERE id = ?", [itemId]);
      return res.status(200).json(item[0]);
    } catch (error) {
      console.error("Erro ao atualizar item de reparo:", error);
      return res.status(500).json({ message: "Erro ao atualizar item de reparo." });
    }
  },

  removeRepairItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      
      // Verifica se o item existe antes de tentar remover
      const existingItem = await query("SELECT id FROM repair_items WHERE id = ?", [itemId]);
      if (existingItem.length === 0) {
        return res.status(404).json({ message: "Item não encontrado." });
      }
      
      await query("DELETE FROM repair_items WHERE id = ?", [itemId]);
      return res.status(200).json({ message: "Item removido." });
    } catch (error) {
      console.error("Erro ao remover item de reparo:", error);
      return res.status(500).json({ message: "Erro ao remover item de reparo." });
    }
  },

  payRepairItem: async (req, res) => {
    try {
      const { itemId } = req.params;
      const { payment_method, paid_value } = req.body;
      // pagamento sem parcelamento: exige quitação do restante
      const rows = await query("SELECT id, cost, COALESCE(paid_value,0) AS paid_value FROM repair_items WHERE id = ?", [itemId]);
      if (!rows.length) return res.status(404).json({ message: "Item não encontrado." });
      const currentPaid = Math.max(0, Number(rows[0].paid_value || 0));
      const cost = Math.max(0, Number(rows[0].cost || 0));
      const remaining = Math.max(0, cost - currentPaid);
      const method = (payment_method || '').toLowerCase();
      if (remaining <= 0) {
        return res.status(400).json({ message: "Item já está quitado." });
      }
      if (method === 'dinheiro') {
        const received = Math.max(0, Number(paid_value || 0));
        if (received < remaining) {
          return res.status(400).json({ message: "Valor insuficiente para pagamento em dinheiro." });
        }
        const change = received - remaining;
        const result = await query(
          "UPDATE repair_items SET paid = 1, payment_method = 'dinheiro', paid_value = ? WHERE id = ?",
          [cost, itemId]
        );
        if (result.affectedRows === 0) return res.status(404).json({ message: "Item não encontrado." });
        return res.status(200).json({ id: itemId, paid: 1, payment_method: 'dinheiro', paid_value: cost, remaining: 0, change });
      }
      // Pix/Cartão: quita diretamente
      const result = await query(
        "UPDATE repair_items SET paid = 1, payment_method = ?, paid_value = ? WHERE id = ?",
        [method || 'pix', cost, itemId]
      );
      if (result.affectedRows === 0) return res.status(404).json({ message: "Item não encontrado." });
      return res.status(200).json({ id: itemId, paid: 1, payment_method: method || 'pix', paid_value: cost, remaining: 0, change: 0 });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      return res.status(500).json({ message: "Erro ao processar pagamento." });
    }
  },

  // Pagamento em massa de todos os itens não pagos de um cliente
  payAllCustomerItems: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { payment_method } = req.body || {};
      if (!customerId) {
        return res.status(400).json({ message: "ID do cliente é obrigatório." });
      }
      const validPaymentMethods = ['dinheiro','pix','cartao','Dinheiro','Cartão','Pix'];
      if (!payment_method || !validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({ message: "Método de pagamento inválido." });
      }

      const vehicles = await query("SELECT id FROM vehicles WHERE customer_id = ?", [customerId]);
      if (!vehicles.length) {
        return res.status(404).json({ message: "Cliente sem veículos cadastrados." });
      }
      const vehicleIds = vehicles.map(v => v.id);

      const placeholders = vehicleIds.map(() => '?').join(',');
      const unpaidItems = await query(
        `SELECT id, cost FROM repair_items WHERE paid = 0 AND vehicle_id IN (${placeholders})`,
        vehicleIds
      );

      if (!unpaidItems.length) {
        return res.status(200).json({ message: "Nenhum item pendente para pagamento.", paidCount: 0, totalValue: 0 });
      }

      // Marca todos como pagos; registra método e valor pago igual ao custo
      const updatePlaceholders = unpaidItems.map(() => '?').join(',');
      await query(
        `UPDATE repair_items SET paid = 1, payment_method = ?, paid_value = cost 
         WHERE id IN (${updatePlaceholders})`,
        [payment_method, ...unpaidItems.map(i => i.id)]
      );

      const totalValue = unpaidItems.reduce((s, it) => s + Number(it.cost || 0), 0);
      return res.status(200).json({ message: "Pagamento em massa concluído.", paidCount: unpaidItems.length, totalValue });
    } catch (error) {
      console.error("Erro no pagamento em massa:", error);
      return res.status(500).json({ message: "Erro ao processar pagamento em massa." });
    }
  },

  // Pagamento de seleção de itens (parcial/total)
  paySelectedItems: async (req, res) => {
    try {
      const { customerId } = req.params;
      const { items, payment_method } = req.body || {};
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Lista de itens é obrigatória." });
      }
      const validPaymentMethods = ['dinheiro','pix','cartao','Dinheiro','Cartão','Pix'];
      if (!payment_method || !validPaymentMethods.includes(payment_method)) {
        return res.status(400).json({ message: "Método de pagamento inválido." });
      }

      // Garante que itens pertencem ao cliente
      const ids = items.map((it) => it.id);
      const placeholders = ids.map(() => '?').join(',');
      const rows = await query(
        `SELECT ri.id, ri.cost, COALESCE(ri.paid_value,0) AS paid_value
         FROM repair_items ri
         JOIN vehicles v ON v.id = ri.vehicle_id
         WHERE v.customer_id = ? AND ri.id IN (${placeholders})`,
        [customerId, ...ids]
      );
      if (rows.length !== ids.length) {
        return res.status(400).json({ message: "Itens inválidos para este cliente." });
      }

      let totalApplied = 0;
      for (const reqItem of items) {
        const row = rows.find((r) => r.id === reqItem.id);
        if (!row) continue;
        const currentPaid = Math.max(0, Number(row.paid_value || 0));
        const cost = Math.max(0, Number(row.cost || 0));
        const remainingBefore = Math.max(0, cost - currentPaid);
        const method = (payment_method || '').toLowerCase();
        if (remainingBefore <= 0) continue;
        if (method === 'dinheiro') {
          const incoming = Math.max(0, Number(reqItem.paid_value || 0));
          if (incoming < remainingBefore) {
            // rejeita pagamentos parciais em massa com dinheiro
            continue;
          }
          await query(
            "UPDATE repair_items SET paid = 1, payment_method = 'dinheiro', paid_value = ? WHERE id = ?",
            [cost, reqItem.id]
          );
          totalApplied += remainingBefore;
        } else {
          await query(
            "UPDATE repair_items SET paid = 1, payment_method = ?, paid_value = ? WHERE id = ?",
            [method || 'pix', cost, reqItem.id]
          );
          totalApplied += remainingBefore;
        }
      }

      return res.status(200).json({ message: "Pagamento aplicado.", totalApplied });
    } catch (error) {
      console.error("Erro ao pagar seleção de itens:", error);
      return res.status(500).json({ message: "Erro ao pagar seleção de itens." });
    }
  },
};

export default customersController;


