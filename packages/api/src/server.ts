import express from 'express';
import { startWorker } from "./temporal/worker.ts";

const app = express();
const port = process.env.PORT || 3000;

app.get('/ping', (_req, res) => res.json({ ok: true }));

// Start the Temporal worker
startWorker().catch((err) => {
  console.error('Failed to start Temporal worker:', err);
  process.exit(1);
});

app.listen(port, () => console.log(`API listening on ${port}`));
