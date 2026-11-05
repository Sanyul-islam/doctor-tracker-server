import express from "express";
import {
  createPatient,
  getAllPatients,
  getSinglePatient,
  updatePatient,
  deletePatient,
} from "../controllers/patientController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createPatient);
router.get("/", authMiddleware, getAllPatients);
router.get("/:id", authMiddleware, getSinglePatient);
router.patch("/:id", authMiddleware, updatePatient);
router.delete("/:id", authMiddleware, deletePatient);

export default router;