export declare function processPodcastWorkflow(digestId: string): Promise<void>;
/**
 * Lightweight workflow used by the UI to obtain a summary on demand.
 */
export declare function generateSummaryWorkflow(digestId: string): Promise<string>;
