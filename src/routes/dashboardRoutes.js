import express from "express";
import {
  getDashboardStats,
  getPatientsPerDoctor,
  getPatientsByMonth,
} from "../controllers/dashboardController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);
router.get("/patients-per-doctor", authMiddleware, getPatientsPerDoctor);
router.get("/patients-by-month", authMiddleware, getPatientsByMonth);

export default router;
