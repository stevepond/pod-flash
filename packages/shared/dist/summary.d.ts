import * as S from "@effect/schema/Schema";
declare const SummaryResponseSchema: S.Schema<{
    readonly predictions: {
        readonly summary: string;
        readonly keywords: readonly string[];
    };
}>;
export type SummaryResponse = S.Infer<typeof SummaryResponseSchema>;
/**
 * Start a Temporal workflow that generates the podcast summary and wait
 * for its result.
 */
export declare function generateSummary(digestId: string): Promise<SummaryResponse>;
export {};
//# sourceMappingURL=summary.d.ts.map