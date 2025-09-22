import { Router } from "express";
import suppliersController from "../controllers/suppliersController.js";

const router = Router();

router.get("/", suppliersController.list);
router.get("/:id", suppliersController.getById);
router.post("/", suppliersController.create);
router.put("/:id", suppliersController.update);
router.delete("/:id", suppliersController.remove);

export default router;


