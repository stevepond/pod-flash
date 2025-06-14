import { Worker } from '@temporalio/worker';
import * as activities from './activities';
export const startWorker = async () => {
    const worker = await Worker.create({
        workflowsPath: new URL('./workflows', import.meta.url).pathname,
        activities,
        taskQueue: 'podcast-digest',
    });
    await worker.run();
};
