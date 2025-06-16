import * as S from "@effect/schema/Schema";
import { Client, Connection } from "@temporalio/client";
// Schema for the API response
const SummaryResponseSchema = S.struct({
    predictions: S.struct({
        summary: S.string,
        keywords: S.array(S.string),
    }),
});
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
export async function generateSummary(digestId) {
    const client = await getTemporalClient();
    // A unique workflow-id lets us trigger multiple summary requests safely.
    const handle = await client.workflow.start("generateSummaryWorkflow", {
        taskQueue: "podcast-digest",
        workflowId: `generate-summary-${digestId}-${Date.now()}`,
        args: [digestId],
    });
    return handle.result(); // resolves to the summary text
}
