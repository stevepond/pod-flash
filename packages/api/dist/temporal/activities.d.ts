import { Digest } from '@pod-flash/shared';
import * as Schema from "effect/Schema";
declare const FlatSchema: Schema.Struct<{
    summary: typeof Schema.String;
    keywords: Schema.Array$<typeof Schema.String>;
}>;
export type Predictions = Schema.Schema.Type<typeof FlatSchema>;
export declare function processPodcastAudio(digestId: string): Promise<void>;
export declare function generateSummary(digestId: string): Promise<Predictions>;
export declare function extractKeywords(digestId: string): Promise<string[]>;
export declare function updateDigestStatus(digestId: string, status: Digest['status']): Promise<void>;
export {};
