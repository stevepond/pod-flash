import { Worker, NativeConnection, DefaultLogger } from "@temporalio/worker";
import * as activities from "./activities.js";
import * as workflows from "./workflows.js";

export const startWorker = async () => {
  const connection = await NativeConnection.connect({
    address: "temporal:7233",
  });

  const logger = new DefaultLogger("WARN");

  const worker = await Worker.create({
    workflowsPath: new URL("./workflows.js", import.meta.url).pathname,
    activities,
    taskQueue: "podcast-digest",
    connection,
  });

  await worker.run();
};
