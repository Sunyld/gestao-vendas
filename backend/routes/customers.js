import { Router } from "express";
import customersController from "../controllers/customersController.js";

const router = Router();

router.get("/", customersController.list);
router.post("/", customersController.create);
router.put("/:id", customersController.update);
router.delete("/:id", customersController.remove);

// Vehicles
router.post("/:customerId/vehicles", customersController.addVehicle);
router.put("/vehicles/:vehicleId", customersController.updateVehicle);
router.delete("/vehicles/:vehicleId", customersController.removeVehicle);

// Repair Items
router.post("/vehicles/:vehicleId/items", customersController.addRepairItem);
router.put("/items/:itemId", customersController.updateRepairItem);
router.delete("/items/:itemId", customersController.removeRepairItem);
router.post("/items/:itemId/pay", customersController.payRepairItem);

// Pagamento em massa (todos os itens pendentes do cliente)
router.post("/:customerId/pay-all", customersController.payAllCustomerItems);

// Pagamento de seleção de itens do cliente (parcial ou total)
router.post("/:customerId/pay-items", customersController.paySelectedItems);

export default router;


