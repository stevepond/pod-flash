import { Digest, Predictions } from "@pod-flash/shared";
import { Effect } from "effect";
import { updateDigest, getDigest } from "../storage/mongodb.js";
import { emitDigestUpdate } from "../events/emitter.js";

const ML_SIDECAR_URL = process.env.ML_SIDECAR_URL || "http://localhost:5000";


export async function processPodcastAudio(digestId: string): Promise<void> {
  console.log(`=== Starting audio processing for digest ${digestId} ===`);

  try {
    const res = await fetch(`${ML_SIDECAR_URL}/transcribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podcast_id: digestId }),
    });
    const data = await res.json();
    console.log("Transcription result:", data);
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
    const res = await fetch(`${ML_SIDECAR_URL}/summarize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ podcast_id: digestId }),
    });
    const data = await res.json();
    console.log(`=== Summary generation completed for digest ${digestId} ===`);
    return { summary: data.summary, keywords: data.keywords ?? [] };
  } catch (error) {
    console.error(`=== Summary generation failed for digest ${digestId} ===`);
    console.error("Error:", error);
    return {
      summary: "Unable to generate summary at this time.",
      keywords: ["error"],
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

export async function trainUserRecommendations(
  userId: string
): Promise<{ recommendations: string[]; clues: string }> {
  console.log(`=== Training recommendations for user ${userId} ===`);
  try {
    const res = await fetch(`${ML_SIDECAR_URL}/train_recs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    const data = await res.json();
    console.log(`=== Training completed for user ${userId} ===`);
    return { recommendations: data.recommendations ?? [], clues: data.clues };
  } catch (error) {
    console.error(`Training failed for user ${userId}`, error);
    return { recommendations: [], clues: "error" };
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
