import { Router } from "express";
import salesController from "../controllers/salesController.js";

const router = Router();

router.post("/", salesController.createSale);
router.get("/", salesController.listSales);
router.get("/history", salesController.salesHistory);
router.get("/completed", salesController.listCompletedSales);
router.post("/:saleId/return", salesController.returnSale);

export default router;


