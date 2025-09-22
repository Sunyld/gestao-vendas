import { Router } from "express";
import reportsController from "../controllers/reportsController.js";

const router = Router();

router.get("/dashboard", reportsController.dashboard);
// Alias para compatibilidade com o frontend antigo
router.get("/", (req, res, next) => {
  if (req.path === "/" && (req.originalUrl.endsWith("/api/dashboard") || req.originalUrl.endsWith("/api/dashboard/"))) {
    return reportsController.dashboard(req, res);
  }
  return next();
});
router.get("/", reportsController.reports);
router.get("/export", reportsController.exportReport);

export default router;


