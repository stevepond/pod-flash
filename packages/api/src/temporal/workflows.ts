import { proxyActivities } from '@temporalio/workflow';
import type * as activities from './activities';

const { processPodcastAudio, generateSummary, extractKeywords, updateDigestStatus } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 hour',
});

export async function processPodcastWorkflow(digestId: string): Promise<void> {
  try {
    await updateDigestStatus(digestId, 'PROCESSING');
    
    // Process the podcast audio
    await processPodcastAudio(digestId);
    
    // Generate summary and keywords in parallel
    const [summary, keywords] = await Promise.all([
      generateSummary(digestId),
      extractKeywords(digestId)
    ]);
    
    // TODO: Store the results in the database
    
    await updateDigestStatus(digestId, 'COMPLETE');
  } catch (error) {
    console.error(`Error processing podcast ${digestId}:`, error);
    await updateDigestStatus(digestId, 'ERROR');
    throw error;
  }
} 