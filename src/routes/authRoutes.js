import express from "express";
import { loginAdmin } from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
// public route
router.post("/login", loginAdmin);

// Protected route
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated admin",
    admin: req.admin,
  });
});

export default router;
