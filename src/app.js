import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());
// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Doctor Tracker API is running",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);

export default app;