import { Worker, NativeConnection, DefaultLogger } from "@temporalio/worker";
import * as activities from "./activities.ts";
import * as workflows from "./workflows.ts";

const address = process.env.TEMPORAL_ADDRESS ?? "temporal:7233";
// Establish connection dynamically based on env
const connection = await NativeConnection.connect({ address });

export const startWorker = async () => {
  // set log level globally
  new DefaultLogger("WARN");

  const worker = await Worker.create({
    workflowsPath: new URL("./workflows.ts", import.meta.url).pathname,
    activities,
    taskQueue: "podcast-digest",
    connection,
  });

  await worker.run();
};
