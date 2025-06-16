import { Router, Request, Response } from "express";
import { Client, Connection } from "@temporalio/client";
import { Digest } from "@pod-flash/shared";
import { generateSummary as sharedGenerateSummary } from "@pod-flash/shared";
import { EventEmitter } from "node:events";
import { createHash } from "node:crypto";

const router: Router = Router();
let client: Client | null = null;

async function initClient() {
  const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";

  console.log(`Initializing Temporal client with address: ${address}`);
  const connection = await Connection.connect({ address });
  client = new Client({ connection });
  console.log("Temporal client initialized successfully");
}

initClient().catch((err) => {
  console.error("Failed to initialize Temporal client:", err);
});

// ---------------------------------------------------------------------------
// In-memory digest store and SSE emitter (placeholder for Cassandra storage)
const digests = new Map<string, Digest>();
const emitter = new EventEmitter();
let cachedList = "";
let cachedEtag = "";

function updateCache() {
  const list = Array.from(digests.values()).filter((d) => d.status === "COMPLETE");
  const json = JSON.stringify(list);
  cachedList = json;
  cachedEtag = createHash("sha1").update(json).digest("hex");
}

// router.get("/:digestId", async (req: Request, res: Response) => {
//   console.log("Fetching digest from Temporal:", req.params.digestId);
//   try {
//     if (!client) {
//       throw new Error("Temporal client not initialized");
//     }

//     const { digestId } = req.params;
//     const handle = client.workflow.getHandle(digestId);
//     const status = await handle.describe();

//     const digest: Digest = {
//       id: digestId,
//       title: "Sample Podcast",
//       status: status.status.name as Digest["status"],
//       keywords: [],
//       summary: "",
//       duration: 0,
//     };

//     res.json(digest);
//   } catch (error) {
//     if (error instanceof WorkflowNotFoundError) {
//       return res.status(404).json({ error: "Digest not found" });
//     }
//     console.error("Error fetching digest:", error);
//     res.status(500).json({ error: "Failed to fetch digest" });
//   }
// });

// router.post("/", async (req: Request, res: Response) => {
//   try {
//     if (!client) {
//       throw new Error("Temporal client not initialized");
//     }

//     const { digestId } = req.body;
//     if (!digestId) {
//       return res.status(400).json({ error: "digestId is required" });
//     }

//     // Try to start the workflow if it does not already exist
//     try {
//       await client.workflow.start("digestWorkflow", {
//         taskQueue: "podcast-digest",
//         workflowId: digestId,
//         args: [digestId],
//       });
//     } catch (e: any) {
//       // If workflow already exists ignore the error
//       if (!e.message?.includes("WorkflowExecutionAlreadyStarted")) {
//         console.error("Failed to start workflow:", e);
//       }
//     }

//     const digest: Digest = {
//       id: digestId,
//       title: "Sample Podcast",
//       status: "PROCESSING",
//       keywords: [],
//       summary: "",
//       duration: 0,
//     } as Digest;

//     res.status(202).json(digest);
//   } catch (error) {
//     console.error("Error creating digest:", error);
//     res.status(500).json({ error: "Failed to create digest" });
//   }
// });

// ---------------------------------------------------------------------------
// GET /api/digests - list completed digests with immutable caching
router.get("/", (req: Request, res: Response) => {
  updateCache();
  if (req.headers["if-none-match"] === cachedEtag) {
    return res.status(304).end();
  }
  res.set("Cache-Control", "public, max-age=31536000, immutable");
  res.set("ETag", cachedEtag);
  res.json(JSON.parse(cachedList));
});

// GET /api/digests/pending - IDs that are not complete
router.get("/pending", (_req: Request, res: Response) => {
  const pending = Array.from(digests.values())
    .filter((d) => d.status !== "COMPLETE")
    .map((d) => d.id);
  res.json(pending);
});

// SSE stream for digest status updates
router.get("/stream/digests", (req: Request, res: Response) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const onUpdate = (digest: Digest) => {
    res.write(`data: ${JSON.stringify({ id: digest.id, status: digest.status })}\n\n`);
  };
  emitter.on("update", onUpdate);
  req.on("close", () => emitter.off("update", onUpdate));
});

// --- Additional route for generating a summary on demand ------------------
router.post("/:digestId/summary", async (req: Request, res: Response) => {
  const { digestId } = req.params;

  if (!digestId) {
    return res.status(400).json({ error: "digestId is required" });
  }

  try {
    const { predictions } = await sharedGenerateSummary(digestId);
    const existing = digests.get(digestId) || {
      id: digestId,
      title: `Podcast ${digestId}`,
      status: "PROCESSING" as const,
    };
    const updated: Digest = {
      ...existing,
      summary: predictions.summary,
      keywords: predictions.keywords,
      status: "COMPLETE",
    };
    digests.set(digestId, updated);
    emitter.emit("update", updated);
    updateCache();
    res.json({ summary: predictions.summary, keywords: predictions.keywords });
  } catch (error) {
    console.error("Failed to generate summary via API:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

export default router;
