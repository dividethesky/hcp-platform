import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

// Shared Redis connection
export function getRedisConnection() {
  return new IORedis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });
}

// Export job queue
export const EXPORT_QUEUE_NAME = "hcp-exports";

export function getExportQueue() {
  return new Queue(EXPORT_QUEUE_NAME, {
    connection: getRedisConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 50 },
    },
  });
}

// Job data shape
export interface ExportJobData {
  exportId: string;
  userId: string;
  sessionCookie: string;
  csrfToken: string | null;
  resumeFromCustomerId?: string; // For resume capability
}

// Add an export job to the queue
export async function enqueueExport(data: ExportJobData): Promise<string> {
  const queue = getExportQueue();
  const job = await queue.add("process-export", data, {
    jobId: data.exportId, // Prevent duplicate jobs for the same export
  });
  return job.id!;
}
