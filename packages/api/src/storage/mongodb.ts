import mongoose from "mongoose";
import { Digest } from "@pod-flash/shared";
import { createClient } from "redis";

const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));
redisClient.connect().catch(console.error);

const DigestSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: String,
  keywords: [String],
  duration: Number,
  status: {
    type: String,
    enum: ["PROCESSING", "COMPLETE", "ERROR"],
    required: true,
  },
  audioUrl: { type: String, required: true },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

const DigestModel = mongoose.model("Digest", DigestSchema);

export async function connectToDatabase() {
  const mongoUrl =
    process.env.MONGODB_URI || "mongodb://localhost:27017/pod-flash";
  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");
}

const CACHE_TTL = 60 * 5; // 5 minutes

async function getFromCache<T>(key: string): Promise<T | null> {
  const cached = await redisClient.get(key);
  return cached ? JSON.parse(cached.toString()) : null;
}

async function setInCache(key: string, value: any): Promise<void> {
  await redisClient.set(key, JSON.stringify(value), { EX: CACHE_TTL });
}

export async function createDigest(digest: Digest): Promise<void> {
  await DigestModel.create(digest);
  await setInCache(`digest:${digest.id}`, digest);
  await redisClient.del("digest:list"); // Invalidate list cache
}

export async function getDigest(id: string): Promise<Digest | null> {
  const cached = await getFromCache<Digest>(`digest:${id}`);
  if (cached) return cached;

  const digest = await DigestModel.findOne({ id });
  if (digest) {
    await setInCache(`digest:${id}`, digest);
  }
  return digest;
}

export async function listDigests(): Promise<Digest[]> {
  const cached = await getFromCache<Digest[]>("digest:list");
  if (cached) return cached;

  const digests = await DigestModel.find().sort({ createdAt: -1 });
  await setInCache("digest:list", digests);
  return digests;
}

export async function updateDigest(id: string, digest: Digest): Promise<void> {
  await DigestModel.findOneAndUpdate({ id }, digest, { upsert: true });
  await setInCache(`digest:${id}`, digest);
  await redisClient.del("digest:list"); // Invalidate list cache
}

export async function deleteDigest(id: string): Promise<boolean> {
  const result = await DigestModel.deleteOne({ id });
  return result.deletedCount > 0;
}
