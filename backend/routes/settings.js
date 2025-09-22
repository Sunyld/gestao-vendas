import { Router } from "express";
import settingsController from "../controllers/settingsController.js";

const router = Router();

router.get("/payment-methods", settingsController.paymentMethods);

export default router;


