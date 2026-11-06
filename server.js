import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// শুধু local-এ listen করবে
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`Server running on ${PORT}`));
  });
}

export default app;
