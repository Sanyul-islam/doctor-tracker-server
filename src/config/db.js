import mongoose from "mongoose";

let connectionPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 8000,
      })
      .then(() => console.log("MongoDB connected successfully"))
      .catch((error) => {
        connectionPromise = null; // fail হলে পরের request-এ আবার চেষ্টা করবে
        console.error("MongoDB connection failed:", error.message);
        throw error;
      });
  }

  await connectionPromise;
};

export default connectDB;
