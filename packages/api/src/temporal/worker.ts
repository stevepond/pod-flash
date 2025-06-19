import { Worker, NativeConnection, DefaultLogger } from "@temporalio/worker";
import * as activities from "./activities.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Establish connection dynamically based on env
const connectWithRetry = async (retries = 5, delay = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `Attempting to connect to Temporal at ${address} (attempt ${
          i + 1
        }/${retries})`
      );
      const connection = await NativeConnection.connect({ address });
      console.log("Successfully connected to Temporal");
      return connection;
    } catch (err: any) {
      console.error(`Failed to connect to Temporal: ${err.message}`);
      if (i < retries - 1) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Max retries reached. Temporal connection failed.");
        throw err;
      }
    }
  }
};

export const startWorker = async () => {
  // set log level globally
  new DefaultLogger("WARN");

  try {
    const connection = await connectWithRetry();

    console.log("Creating Temporal worker...");

    // Use absolute path to the workflows file
    const workflowsPath = path.join(__dirname, "workflows.js");
    console.log(`Workflows path: ${workflowsPath}`);

    const worker = await Worker.create({
      workflowsPath,
      activities,
      taskQueue: "podcast-digest",
      connection,
      // Simplified webpack configuration to avoid path issues
      bundlerOptions: {
        webpackConfigHook: (config) => {
          // Only exclude problematic modules, don't modify entry/output
          config.externals = config.externals || [];
          if (Array.isArray(config.externals)) {
            config.externals.push(
              /^node:/,
              /^mongodb/,
              /^mongoose/,
              /^redis/,
              /^@aws-sdk/,
              /^express/,
              /^cors/,
              /^express-fileupload/,
              /^effect/,
              /^@effect/
            );
          }
          return config;
        },
      },
    });

    console.log("Starting Temporal worker...");
    await worker.run();
    console.log("Temporal worker started successfully");
  } catch (err: any) {
    console.error("Failed to start Temporal worker:", err);
    // Don't throw - allow the API server to continue running
    console.log("API server will continue without Temporal worker");
  }
};
