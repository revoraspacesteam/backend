const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");

dotenv.config();

const enquiryRoutes = require("./routes/enquiries");

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:3000";

app.disable("x-powered-by");
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});
app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/enquiries", enquiryRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Each attachment must be 2 MB or smaller."
          : error.message,
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({
    message: error.message || "Unable to submit your enquiry.",
  });
});

async function start() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is required in backend/.env");
  }

  await mongoose.connect(mongoUri);
  app.listen(port, () => {
    console.log(`Revora API listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start Revora API:", error.message);
  process.exit(1);
});

async function shutdown() {
  await mongoose.disconnect();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
