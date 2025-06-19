import * as Schema from "@effect/schema";

export const DigestSchema = Schema.struct({
  id: Schema.string,
  title: Schema.string,
  summary: Schema.optional(Schema.string),
  keywords: Schema.optional(Schema.array(Schema.string)),
  duration: Schema.optional(Schema.number),
  status: Schema.union(
    Schema.literal("PROCESSING"),
    Schema.literal("COMPLETE"),
    Schema.literal("ERROR")
  ),
  audioUrl: Schema.string,
  createdAt: Schema.string,
  updatedAt: Schema.string,
});

export type Digest = Schema.Infer<typeof DigestSchema>;

export const PredictionsSchema = Schema.struct({
  summary: Schema.string,
  keywords: Schema.array(Schema.string),
});

export type Predictions = Schema.Infer<typeof PredictionsSchema>;
