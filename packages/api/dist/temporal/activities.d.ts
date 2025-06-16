import { Digest } from '@pod-flash/shared';
export declare function processPodcastAudio(digestId: string): Promise<void>;
export declare function generateSummary(digestId: string): Promise<string>;
export declare function extractKeywords(digestId: string): Promise<string[]>;
export declare function updateDigestStatus(digestId: string, status: Digest['status']): Promise<void>;
