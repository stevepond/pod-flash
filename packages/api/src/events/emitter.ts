import { EventEmitter } from "node:events";
import { Digest } from "@pod-flash/shared";

// SSE emitter for digest status updates
export const digestEmitter = new EventEmitter();

export function emitDigestUpdate(digest: Digest): void {
  console.log(`=== Emitting digest update for ${digest.id} ===`);
  digestEmitter.emit("update", digest);
}
