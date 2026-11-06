import express from "express";
import {
  loginAdmin,
  getMe,
  logoutAdmin,
} from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
// public route
router.post("/login", loginAdmin);
// protected routes
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutAdmin);

export default router;
