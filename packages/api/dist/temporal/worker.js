import { Worker, NativeConnection, DefaultLogger } from "@temporalio/worker";
import * as activities from "./activities.js";
const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";
// Establish connection dynamically based on env
const connectWithRetry = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Attempting to connect to Temporal at ${address} (attempt ${i + 1}/${retries})`);
            const connection = await NativeConnection.connect({ address });
            console.log("Successfully connected to Temporal");
            return connection;
        }
        catch (err) {
            console.error(`Failed to connect to Temporal: ${err.message}`);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay / 1000} seconds...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
            else {
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
        const worker = await Worker.create({
            workflowsPath: new URL("./workflows.js", import.meta.url).pathname,
            activities,
            taskQueue: "podcast-digest",
            connection,
        });
        await worker.run();
    }
    catch (err) {
        console.error("Failed to start Temporal worker:", err);
        // Don't throw - allow the API server to continue running
    }
};
