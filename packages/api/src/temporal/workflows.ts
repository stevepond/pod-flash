import { proxyActivities } from '@temporalio/workflow';

// Define activity interfaces directly to avoid import chains
interface Activities {
  processPodcastAudio(digestId: string): Promise<void>;
  generateSummary(digestId: string): Promise<{ summary: string; keywords: string[] }>;
  extractKeywords(digestId: string): Promise<string[]>;
  updateDigestStatus(
    digestId: string, 
    status: "PROCESSING" | "COMPLETE" | "ERROR",
    updates?: { summary?: string; keywords?: string[]; duration?: number }
  ): Promise<void>;
}

// Create proxies for every activity we want to call from workflows
const {
  processPodcastAudio,
  generateSummary: generateSummaryActivity,
  extractKeywords: extractKeywordsActivity,
  updateDigestStatus: updateDigestStatusActivity,
} = proxyActivities<Activities>({
  startToCloseTimeout: "1 hour",
});

export async function processPodcastWorkflow(digestId: string): Promise<void> {
  console.log(
    `=== Starting processPodcastWorkflow for digest: ${digestId} ===`
  );

  try {
    console.log("Updating digest status to PROCESSING...");
    await updateDigestStatusActivity(digestId, "PROCESSING");

    // Process the podcast audio (transcription)
    console.log("Starting audio processing...");
    await processPodcastAudio(digestId);
    console.log("Audio processing completed");

    // Generate summary and keywords in parallel
    console.log("Starting summary and keyword generation...");
    const [summary, keywords] = await Promise.all([
      generateSummaryActivity(digestId),
      extractKeywordsActivity(digestId),
    ]);
    console.log("Summary and keyword generation completed");

    // Store the results in the database using activities
    console.log("Storing results in database...");

    // Update the digest with the results using an activity
    await updateDigestStatusActivity(digestId, "COMPLETE", {
      summary: summary.summary,
      keywords: summary.keywords,
    });

    console.log("Database updated successfully");
    console.log(
      `=== processPodcastWorkflow completed successfully for digest: ${digestId} ===`
    );
  } catch (error) {
    console.error(
      `=== processPodcastWorkflow failed for digest: ${digestId} ===`
    );
    console.error("Error:", error);

    // Update status to ERROR
    await updateDigestStatusActivity(digestId, "ERROR");

    throw error;
  }
}

/**
 * Lightweight workflow used by the UI to obtain a summary on demand.
 */
export async function generateSummaryWorkflow(
  digestId: string
): Promise<{ summary: string; keywords: string[] }> {
  const result = await generateSummaryActivity(digestId);
  return {
    summary: result.summary,
    keywords: [...result.keywords],
  };
} 