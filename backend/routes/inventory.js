import { Router } from "express";
import inventoryController from "../controllers/inventoryController.js";

const router = Router();

router.get("/", inventoryController.listProducts);
router.post("/", inventoryController.createProduct);
router.put("/:id", inventoryController.updateProduct);
router.delete("/:id", inventoryController.deleteProduct);
router.patch("/:id/stock", inventoryController.patchStock);

export default router;


