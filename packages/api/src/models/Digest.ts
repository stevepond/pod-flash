import mongoose from "mongoose";
import { Digest } from "@pod-flash/shared";

const digestSchema = new mongoose.Schema<Digest>({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  summary: { type: String },
  keywords: [{ type: String }],
  audioUrl: { type: String, required: true },
  status: {
    type: String,
    enum: ["PROCESSING", "COMPLETE", "ERROR"],
    required: true,
  },
  duration: { type: Number },
  createdAt: { type: String, required: true },
  updatedAt: { type: String, required: true },
});

export const DigestModel = mongoose.model<Digest>("Digest", digestSchema);
