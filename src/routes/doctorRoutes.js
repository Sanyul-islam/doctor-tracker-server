import express from "express";

import {
  createDoctor,
  getAllDoctors,
  getSingleDoctor,
  updateDoctor,
  deleteDoctor,
} from "../controllers/doctorController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/", authMiddleware, createDoctor);
router.get("/", authMiddleware, getAllDoctors);
router.get("/:id", authMiddleware, getSingleDoctor);
router.patch("/:id", authMiddleware, updateDoctor);
router.delete("/:id", authMiddleware, deleteDoctor);
export default router;
