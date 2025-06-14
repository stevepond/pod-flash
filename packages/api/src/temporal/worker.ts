import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';
import * as workflows from './workflows.js';

export const startWorker = async () => {
  const worker = await Worker.create({
    workflowsPath: new URL('./workflows.js', import.meta.url).pathname,
    activities,
    taskQueue: 'podcast-digest',
  });

  await worker.run();
}; 