import express from 'express';
import { startWorker } from "./temporal/worker.js";
import digestsRouter from "./routes/digests.js";
import cors from "cors";
import fileUpload from "express-fileupload";
import { connectToDatabase } from "./storage/mongodb.js";

const app = express();
const port = process.env.PORT || 3000;

// Configure CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? ["http://localhost:5173"]
        : undefined,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Configure file upload middleware first (before express.json)
app.use(
  fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    abortOnLimit: true,
    responseOnLimit: "File size limit has been reached",
    useTempFiles: false,
    tempFileDir: "/tmp/",
    debug: process.env.NODE_ENV === "development",
  })
);

app.use(express.json());
app.use("/api/digests", digestsRouter);
app.get("/ping", (_req, res) => res.json({ ok: true }));

// Initialize S3 bucket (simplified for now)
async function initializeS3() {
  console.log("Initializing S3 (simplified implementation)");
  const bucketName = process.env.S3_BUCKET_NAME || "pod-flash";
  console.log(`S3 bucket ${bucketName} ready (simulated)`);
}

// Initialize services
async function initialize() {
  try {
    await connectToDatabase();
    await initializeS3();
    await startWorker();
    console.log("All services initialized successfully");
  } catch (error) {
    console.error("Failed to initialize services:", error);
    process.exit(1);
  }
}

app.listen(port, () => {
  console.log(`API listening on ${port}`);
  initialize().catch((err) => {
    console.error("Failed to initialize services:", err);
    process.exit(1);
  });
});
