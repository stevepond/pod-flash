import { proxyActivities } from '@temporalio/workflow';
// Create proxies for every activity we want to call from workflows
const { processPodcastAudio, generateSummary: generateSummaryActivity, extractKeywords: extractKeywordsActivity, updateDigestStatus: updateDigestStatusActivity, } = proxyActivities({
    startToCloseTimeout: "1 hour",
});
export async function processPodcastWorkflow(digestId) {
    try {
        await updateDigestStatusActivity(digestId, "PROCESSING");
        // Process the podcast audio
        await processPodcastAudio(digestId);
        // Generate summary and keywords in parallel
        const [summary, keywords] = await Promise.all([
            generateSummaryActivity(digestId),
            extractKeywordsActivity(digestId),
        ]);
        // TODO: Store the results in the database
        console.log("Summary!!:", summary);
        await updateDigestStatusActivity(digestId, "COMPLETE");
    }
    catch (error) {
        console.error(`Error processing podcast ${digestId}:`, error);
        await updateDigestStatusActivity(digestId, "ERROR");
        throw error;
    }
}
/**
 * Lightweight workflow used by the UI to obtain a summary on demand.
 */
export async function generateSummaryWorkflow(digestId) {
    return generateSummaryActivity(digestId);
}
