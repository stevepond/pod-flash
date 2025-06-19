import * as Schema from "@effect/schema";
import { Client, Connection } from "@temporalio/client";
import { Predictions } from "@pod-flash/shared";

// Schema for the API response
const SummaryResponseSchema = Schema.struct({
  predictions: Schema.struct({
    summary: Schema.string,
    keywords: Schema.array(Schema.string),
  }),
});

export type SummaryResponse = Schema.Infer<typeof SummaryResponseSchema>;

// --- Temporal helpers -------------------------------------------------------
async function getTemporalClient() {
  const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";
  const connection = await Connection.connect({ address });
  return new Client({ connection });
}

// ---------------------------------------------------------------------------
/**
 * Start a Temporal workflow that generates the podcast summary and wait
 * for its result.
 */
export async function generateSummary(
  digestId: string
): Promise<{ predictions: Predictions }> {
  const client = await getTemporalClient();

  // A unique workflow-id lets us trigger multiple summary requests safely.
  const handle = await client.workflow.start("generateSummaryWorkflow", {
    taskQueue: "podcast-digest",
    workflowId: `generate-summary-${digestId}-${Date.now()}`,
    args: [digestId],
  });

  return handle.result(); // resolves to the summary text
}

// ---------------------------------------------------------------------------
/**
 * Start a Temporal workflow that processes the entire podcast pipeline:
 * 1. Process audio file
 * 2. Generate transcript
 * 3. Generate summary and keywords
 * 4. Update database
 */
export async function processPodcastWorkflow(digestId: string): Promise<void> {
  const client = await getTemporalClient();

  console.log(`Starting processPodcastWorkflow for digest: ${digestId}`);

  // Start the workflow and don't wait for it to complete
  // This allows the API to return immediately while processing continues
  await client.workflow.start("processPodcastWorkflow", {
    taskQueue: "podcast-digest",
    workflowId: `process-podcast-${digestId}-${Date.now()}`,
    args: [digestId],
  });

  console.log(
    `processPodcastWorkflow started successfully for digest: ${digestId}`
  );
}
