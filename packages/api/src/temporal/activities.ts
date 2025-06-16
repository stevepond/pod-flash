import { Digest } from '@pod-flash/shared';
import * as Schema from "effect/Schema";
import { Effect } from "effect";
import {
  HttpClient,
  FetchHttpClient,
  HttpBody,
  HttpClientResponse,
} from "@effect/platform";

// Define the schema at the top level
const PredictionsSchema = Schema.Struct({
  predictions: Schema.Struct({
    summary: Schema.String,
    keywords: Schema.Array(Schema.String),
  }),
});
export type Predictions = Schema.Schema.Type<typeof PredictionsSchema>;

const transcript = `
Over the last decade, remote work has evolved from a rare perk offered by forward-thinking tech companies to a mainstream employment model accelerated by global necessity. The COVID-19 pandemic served as a catalyst, forcing millions of organizations to pivot rapidly to work-from-home arrangements. While many expected this shift to be temporary, the long-term impacts are now deeply embedded in the global labor market.

At the core of this transformation is a redefinition of work itself—not just where it's performed, but how productivity, collaboration, and culture are measured. In traditional office settings, managers often equated productivity with physical presence. With the rise of remote work, that notion has shifted toward output-oriented metrics. Employees are judged more by deliverables and results than by hours clocked or face time, which has led to a surge in interest around asynchronous communication tools, project management software, and performance-based evaluations.

One of the most significant benefits reported by remote workers is improved work-life balance. Without the stress and time commitment of commuting, many individuals find they have more hours in the day to focus on personal well-being, family, or passion projects. This flexibility has also opened the door for workers to relocate from expensive urban centers to more affordable locations, further boosting their quality of life. For employers, this relocation trend offers access to a broader, more diverse talent pool unconstrained by geographic boundaries.

However, remote work is not without its challenges. The loss of in-person interaction can hinder collaboration and spontaneous innovation, particularly in creative or cross-functional teams. Companies have been experimenting with virtual whiteboards, regular video check-ins, and "digital water coolers" to try to bridge the social gap. Still, issues like Zoom fatigue and feelings of isolation persist. Some organizations have responded by adopting hybrid models, where employees split their time between home and the office to strike a balance between flexibility and connection.

The shift to remote work has also had significant implications for urban infrastructure, commercial real estate, and local economies. Cities that once thrived on the daily influx of commuters are now grappling with underutilized office space, declining public transit revenue, and a shift in demand toward suburban services. On the flip side, smaller cities and rural areas are seeing renewed interest as viable hubs for remote workers, triggering growth in local economies and increased demand for high-speed internet infrastructure.

From a global perspective, remote work has democratized opportunity. Talented individuals in developing regions can now participate in the global job market without relocating. But this global fluidity also introduces new considerations around taxation, labor law compliance, and cybersecurity. Governments and companies alike are still adapting to this borderless workforce, shaping policies that accommodate both flexibility and accountability.

Ultimately, the rise of remote work represents a fundamental change in the fabric of modern employment. It challenges assumptions about productivity, management, and company culture. While not a one-size-fits-all solution, it offers a compelling alternative to the traditional office, one that many argue is here to stay. The organizations that thrive will be those that embrace this shift thoughtfully—balancing freedom with structure, and innovation with inclusion.
`;

export async function processPodcastAudio(digestId: string): Promise<void> {
  // TODO: Implement audio processing logic
  console.log(`Processing audio for digest ${digestId}`);
}

export async function generateSummary(digestId: string): Promise<Predictions> {
  return Effect.runPromise(
    HttpClient.post(
      "https://dbc-058ab750-8aad.cloud.databricks.com/serving-endpoints/summarise/invocations",
      {
        headers: {
          Authorization: `Bearer ${process.env.DATABRICKS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: HttpBody.unsafeJson({
          inputs: [{ transcript }],
        }),
      }
    ).pipe(
      Effect.flatMap((res: HttpClientResponse.HttpClientResponse) => res.json),
      Effect.flatMap((data) => Schema.decodeUnknown(PredictionsSchema)(data)),
      Effect.catchAll((error) => {
        console.error("Failed to process summary request", error);
        return Effect.fail(error);
      }),
      Effect.provide(FetchHttpClient.layer)
    )
  );
}

export async function extractKeywords(digestId: string): Promise<string[]> {
  // TODO: Implement keyword extraction logic
  console.log(`Extracting keywords for digest ${digestId}`);
  return ['sample', 'keywords'];
}

export async function updateDigestStatus(digestId: string, status: Digest['status']): Promise<void> {
  // TODO: Implement status update logic
  console.log(`Updating status for digest ${digestId} to ${status}`);
} 