import { Effect } from "effect";
import * as Schema from "@effect/schema";
import {
  HttpClient,
  FetchHttpClient,
  HttpBody,
  HttpClientResponse,
} from "@effect/platform";
import { Digest, Predictions, PredictionsSchema } from "@pod-flash/shared";
import { updateDigest, getDigest } from "../storage/mongodb.js";
import { emitDigestUpdate } from "../events/emitter.js";

// Sample transcript for testing - in production this would come from audio processing
const sampleTranscript = `
Over the last decade, remote work has evolved from a rare perk offered by forward-thinking tech companies to a mainstream employment model accelerated by global necessity. The COVID-19 pandemic served as a catalyst, forcing millions of organizations to pivot rapidly to work-from-home arrangements. While many expected this shift to be temporary, the long-term impacts are now deeply embedded in the global labor market.

At the core of this transformation is a redefinition of work itself—not just where it's performed, but how productivity, collaboration, and culture are measured. In traditional office settings, managers often equated productivity with physical presence. With the rise of remote work, that notion has shifted toward output-oriented metrics. Employees are judged more by deliverables and results than by hours clocked or face time, which has led to a surge in interest around asynchronous communication tools, project management software, and performance-based evaluations.

One of the most significant benefits reported by remote workers is improved work-life balance. Without the stress and time commitment of commuting, many individuals find they have more hours in the day to focus on personal well-being, family, or passion projects. This flexibility has also opened the door for workers to relocate from expensive urban centers to more affordable locations, further boosting their quality of life. For employers, this relocation trend offers access to a broader, more diverse talent pool unconstrained by geographic boundaries.

However, remote work is not without its challenges. The loss of in-person interaction can hinder collaboration and spontaneous innovation, particularly in creative or cross-functional teams. Companies have been experimenting with virtual whiteboards, regular video check-ins, and "digital water coolers" to try to bridge the social gap. Still, issues like Zoom fatigue and feelings of isolation persist. Some organizations have responded by adopting hybrid models, where employees split their time between home and the office to strike a balance between flexibility and connection.

The shift to remote work has also had significant implications for urban infrastructure, commercial real estate, and local economies. Cities that once thrived on the daily influx of commuters are now grappling with underutilized office space, declining public transit revenue, and a shift in demand toward suburban services. On the flip side, smaller cities and rural areas are seeing renewed interest as viable hubs for remote workers, triggering growth in local economies and increased demand for high-speed internet infrastructure.

From a global perspective, remote work has democratized opportunity. Talented individuals in developing regions can now participate in the global job market without relocating. But this global fluidity also introduces new considerations around taxation, labor law compliance, and cybersecurity. Governments and companies alike are still adapting to this borderless workforce, shaping policies that accommodate both flexibility and accountability.

Ultimately, the rise of remote work represents a fundamental change in the fabric of modern employment. It challenges assumptions about productivity, management, and company culture. While not a one-size-fits-all solution, it offers a compelling alternative to the traditional office, one that many argue is here to stay. The organizations that thrive will be those that embrace this shift thoughtfully—balancing freedom with structure, and innovation with inclusion.
`;

export async function processPodcastAudio(digestId: string): Promise<void> {
  console.log(`=== Starting audio processing for digest ${digestId} ===`);

  try {
    // TODO: Implement actual audio processing logic
    // This should:
    // 1. Download the audio file from S3 using the digestId
    // 2. Convert audio to text using a speech-to-text service
    // 3. Store the transcript for later use

    console.log(
      `Processing audio for digest ${digestId} - using sample transcript for now`
    );

    // Simulate processing time (2-5 seconds)
    const processingTime = Math.random() * 3000 + 2000;
    await new Promise((resolve) => setTimeout(resolve, processingTime));

    console.log(`=== Audio processing completed for digest ${digestId} ===`);
  } catch (error) {
    console.error(`=== Audio processing failed for digest ${digestId} ===`);
    console.error("Error:", error);
    throw error;
  }
}

export async function generateSummary(digestId: string): Promise<Predictions> {
  console.log(`=== Starting summary generation for digest ${digestId} ===`);

  try {
    // TODO: Get the actual transcript from the processed audio
    // For now, we'll use the sample transcript as a placeholder
    const transcript = sampleTranscript;

    console.log("Calling Databricks API for summary generation...");

    // Check if we have the required API token and endpoint
    if (!process.env.DATABRICKS_TOKEN || !process.env.DATABRICKS_ENDPOINT) {
      console.warn(
        "DATABRICKS_TOKEN or DATABRICKS_ENDPOINT not found, using mock summary"
      );
      return {
        summary:
          "This is a mock summary generated for testing purposes. The actual summary would be generated by the Databricks API using the podcast transcript.",
        keywords: ["mock", "summary", "testing", "podcast", "remote work"],
      };
    }

    const rawResult: unknown = await Effect.runPromise(
      HttpClient.post(
        `${process.env.DATABRICKS_ENDPOINT}/serving-endpoints/summarise/invocations`,
        {
          headers: {
            Authorization: `Bearer ${process.env.DATABRICKS_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: HttpBody.unsafeJson({
            inputs: {
              transcript: [transcript],
            },
          }),
        }
      ).pipe(
        Effect.tap((raw) =>
          Effect.sync(() =>
            console.log(
              "Databricks response received (raw):",
              JSON.stringify(raw)
            )
          )
        ),
        Effect.flatMap(
          (res: HttpClientResponse.HttpClientResponse) => res.json
        ),
        Effect.catchAll((error) => {
          console.error("Failed to process summary request", error);
          return Effect.fail(error);
        }),
        Effect.provide(FetchHttpClient.layer)
      )
    );

    console.log("Databricks response (parsed):", JSON.stringify(rawResult));

    // Defensive: ensure the result has summary and keywords
    if (
      typeof rawResult === "object" &&
      rawResult !== null &&
      typeof (rawResult as any).summary === "string" &&
      Array.isArray((rawResult as any).keywords)
    ) {
      const summary = (rawResult as any).summary as string;
      const keywords = (rawResult as any).keywords as string[];
      console.log(
        `=== Summary generation completed for digest ${digestId} ===`
      );
      console.log(`Generated summary: ${summary.substring(0, 100)}...`);
      console.log(`Generated keywords: ${keywords.join(", ")}`);
      return { summary, keywords };
    } else {
      console.warn(
        "Databricks response missing summary or keywords, using fallback"
      );
      const keywords =
        typeof rawResult === "object" &&
        rawResult !== null &&
        Array.isArray((rawResult as any).keywords)
          ? ((rawResult as any).keywords as string[])
          : ["podcast"];
      return {
        summary:
          "Summary could not be generated due to missing fields in the Databricks response.",
        keywords,
      };
    }
  } catch (error) {
    console.error(`=== Summary generation failed for digest ${digestId} ===`);
    console.error("Error:", error);
    // Return a fallback summary if the API fails
    console.log("Returning fallback summary due to API failure");
    return {
      summary:
        "Unable to generate summary at this time. Please try again later.",
      keywords: ["error", "retry", "podcast"],
    };
  }
}

export async function extractKeywords(digestId: string): Promise<string[]> {
  console.log(`=== Starting keyword extraction for digest ${digestId} ===`);

  try {
    // TODO: Implement actual keyword extraction logic
    // This could use NLP libraries or call external APIs

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Return sample keywords for now
    const keywords = [
      "remote work",
      "productivity",
      "work-life balance",
      "technology",
      "future of work",
    ];
    console.log(`=== Keyword extraction completed for digest ${digestId} ===`);
    console.log(`Extracted keywords: ${keywords.join(", ")}`);

    return keywords;
  } catch (error) {
    console.error(`=== Keyword extraction failed for digest ${digestId} ===`);
    console.error("Error:", error);
    return ["error", "extraction", "failed"];
  }
}

export async function updateDigestStatus(
  digestId: string,
  status: Digest["status"],
  updates?: Partial<Pick<Digest, "summary" | "keywords" | "duration">>
): Promise<void> {
  console.log(`=== Updating status for digest ${digestId} to ${status} ===`);

  try {
    // Get the existing digest
    const existingDigest = await getDigest(digestId);
    if (!existingDigest) {
      throw new Error(`Digest ${digestId} not found`);
    }

    // Create the updated digest
    const updatedDigest: Digest = {
      ...existingDigest,
      status,
      updatedAt: new Date().toISOString(),
      ...updates,
    };

    // Update directly in database
    await updateDigest(digestId, updatedDigest);

    // Emit SSE event for real-time UI updates
    emitDigestUpdate(updatedDigest);

    console.log(
      `Successfully updated digest ${digestId} with status ${status}`
    );

    if (updates) {
      console.log(`Additional updates applied:`, updates);
    }
  } catch (error) {
    console.error(`Failed to update digest ${digestId}:`, error);
    throw error;
  }
}

export const generateDigest = async (audioUrl: string): Promise<Digest> => {
  return Effect.runPromise(
    Effect.gen(function* (_) {
      // TODO: Implement actual digest generation
      return {
        id: "1",
        title: "Test Digest",
        summary: "This is a test digest",
        keywords: ["test", "example"],
        audioUrl,
        status: "COMPLETE",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    })
  );
};
