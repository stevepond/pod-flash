import express from 'express';
import { startWorker } from "./temporal/worker.js";
import digestsRouter from "./routes/digests.js";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3000;
// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === "development"
        ? ["http://localhost:5173"]
        : undefined,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
}));
app.use(express.json());
app.use("/api/digests", digestsRouter);
app.get("/ping", (_req, res) => res.json({ ok: true }));
app.listen(port, () => {
    console.log(`API listening on ${port}`);
    startWorker().catch((err) => {
        console.error("Failed to start Temporal worker:", err);
        // Do not exit; keep the server running for CORS and error responses
    });
});
