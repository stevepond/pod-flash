import { Router, Request, Response } from "express";
import { Connection } from "@temporalio/client";
import {
  generateSummary,
  processPodcastWorkflow,
} from "../temporal/summary.js";
import { createHash } from "node:crypto";
import fileUpload from "express-fileupload";
import { UploadedFile } from "express-fileupload";
import { Digest } from "@pod-flash/shared";
import { uploadFile, getSignedDownloadUrl } from "../storage/s3.js";
import {
  createDigest,
  listDigests,
  updateDigest,
  getDigest,
} from "../storage/mongodb.js";
import { digestEmitter, emitDigestUpdate } from "../events/emitter.js";

const router: Router = Router();

async function initClient() {
  const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";

  console.log(`Initializing Temporal client with address: ${address}`);
  await Connection.connect({ address });
  console.log("Temporal client initialized successfully");
}

initClient().catch((err) => {
  console.error("Failed to initialize Temporal client:", err);
});

// ---------------------------------------------------------------------------
// GET /api/digests - list completed digests
router.get("/", async (_req: Request, res: Response) => {
  try {
    const digests = await listDigests();
    res.json(digests);
  } catch (error) {
    console.error("Failed to list digests:", error);
    res.status(500).json({ error: "Failed to list digests" });
  }
});

// GET /api/digests/pending - IDs that are not complete
router.get("/pending", async (_req: Request, res: Response) => {
  try {
    const digests = await listDigests();
    const pending = digests
      .filter((d) => d.status !== "COMPLETE")
      .map((d) => d.id);
    res.json(pending);
  } catch (error) {
    console.error("Failed to list pending digests:", error);
    res.status(500).json({ error: "Failed to list pending digests" });
  }
});

// SSE stream for digest status updates
router.get("/stream/digests", (req: Request, res: Response) => {
  console.log("=== New SSE client connected ===");
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders();

  const onUpdate = (digest: Digest) => {
    console.log(`=== Sending SSE update for digest ${digest.id} ===`);
    console.log("Digest data being sent:", JSON.stringify(digest, null, 2));
    res.write(`data: ${JSON.stringify(digest)}\n\n`);
  };
  digestEmitter.on("update", onUpdate);
  req.on("close", () => {
    console.log("=== SSE client disconnected ===");
    digestEmitter.off("update", onUpdate);
  });
});

// Add file upload endpoint
router.post("/upload", async (req: Request, res: Response) => {
  console.log("=== Starting file upload process ===");

  try {
    const file = req.files?.file as UploadedFile;
    if (!file) {
      console.error("No file found in request");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(
      `Processing file: ${file.name}, size: ${file.size} bytes, type: ${file.mimetype}`
    );

    const digestId = createHash("sha1")
      .update(file.name + Date.now().toString())
      .digest("hex");

    console.log(`Generated digest ID: ${digestId}`);

    // Upload file to S3
    console.log("Uploading file to S3...");
    const key = `uploads/${digestId}/${file.name}`;
    await uploadFile(file.data, key, file.mimetype);
    console.log(`File uploaded to S3 with key: ${key}`);

    const audioUrl = await getSignedDownloadUrl(key);
    console.log(`Generated signed URL for audio file`);

    // Create initial digest entry
    console.log("Creating initial digest entry in database...");
    const digest: Digest = {
      id: digestId,
      title: file.name,
      status: "PROCESSING",
      duration: 0,
      audioUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await createDigest(digest);
    console.log("Digest entry created successfully");

    emitDigestUpdate(digest);
    console.log("Emitted initial update event");

    // Start actual processing with Temporal workflow
    console.log("Starting Temporal workflow for audio processing...");
    try {
      // Start the podcast processing workflow (this runs asynchronously)
      await processPodcastWorkflow(digestId);
      console.log(
        "Temporal workflow started successfully - processing will continue in background"
      );

      // The workflow will handle updating the digest status when complete
      // For now, we return the initial digest with PROCESSING status
      // The UI can poll for updates or use SSE to get real-time status changes
    } catch (workflowError) {
      console.error("Failed to start Temporal workflow:", workflowError);

      // Update digest with error status
      const errorDigest: Digest = {
        ...digest,
        status: "ERROR",
        updatedAt: new Date().toISOString(),
      };

      await updateDigest(digestId, errorDigest);
      emitDigestUpdate(errorDigest);
      console.log("Emitted error update event");
    }

    console.log("=== File upload process completed ===");
    res.status(202).json(digest);
  } catch (error) {
    console.error("=== File upload process failed ===");
    console.error("Failed to upload file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

// --- Additional route for generating a summary on demand ------------------
router.post("/:digestId/summary", async (req: Request, res: Response) => {
  const { digestId } = req.params;

  if (!digestId) {
    return res.status(400).json({ error: "digestId is required" });
  }

  try {
    const { predictions } = await generateSummary(digestId);
    const existing = (await getDigest(digestId)) || {
      id: digestId,
      title: `Podcast ${digestId}`,
      status: "PROCESSING" as const,
      duration: 0,
      audioUrl: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated: Digest = {
      ...existing,
      summary: predictions.summary,
      keywords: [...predictions.keywords],
      status: "COMPLETE",
      duration: existing.duration ?? 0,
    };
    await updateDigest(digestId, updated);
    emitDigestUpdate(updated);
    res.json({ summary: predictions.summary, keywords: predictions.keywords });
  } catch (error) {
    console.error("Failed to generate summary via API:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// GET /api/digests/:id - get individual digest
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const digest = await getDigest(id);
    if (!digest) {
      return res.status(404).json({ error: "Digest not found" });
    }
    res.json(digest);
  } catch (error) {
    console.error("Failed to get digest:", error);
    res.status(500).json({ error: "Failed to get digest" });
  }
});

// PUT /api/digests/:id - update individual digest
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const digest = req.body as Digest;
    console.log(`=== Updating digest ${id} via API ===`);
    console.log("Updated digest data:", JSON.stringify(digest, null, 2));

    await updateDigest(id, digest);

    // Emit update event for real-time UI updates
    console.log(`=== Emitting SSE update event for digest ${id} ===`);
    emitDigestUpdate(digest);
    console.log("SSE event emitted successfully");

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to update digest:", error);
    res.status(500).json({ error: "Failed to update digest" });
  }
});

export default router;
