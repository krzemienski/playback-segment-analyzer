import Queue from "bull";
import { redis } from "./redis";
import { storage } from "../storage";
import { videoProcessor } from "../services/video-processor";

// Create job queue
export const jobQueue = new Queue("video processing", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
  },
});

// Process jobs
jobQueue.process("process-video", async (job) => {
  const { jobId, videoId, filename, type } = job.data;
  
  try {
    // Update job status to processing
    await storage.updateJob(jobId, { 
      status: "processing", 
      startedAt: new Date(),
      progress: 0 
    });

    // Process the video based on type
    let result;
    switch (type) {
      case "scene_detection":
        result = await videoProcessor.detectScenes(filename, (progress: number) => {
          // Update progress in real-time
          storage.updateJob(jobId, { progress });
        });
        break;
      case "preview_generation":
        result = await videoProcessor.generatePreviews(filename, (progress: number) => {
          storage.updateJob(jobId, { progress });
        });
        break;
      case "thumbnail_extraction":
        result = await videoProcessor.extractThumbnails(filename, (progress: number) => {
          storage.updateJob(jobId, { progress });
        });
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    // Update job as completed
    await storage.updateJob(jobId, { 
      status: "completed", 
      progress: 100,
      completedAt: new Date(),
      data: result 
    });

    // Update video status
    await storage.updateVideo(videoId, { status: "completed" });

    return result;
  } catch (error) {
    console.error(`Job ${jobId} failed:`, error);
    
    // Update job as failed
    await storage.updateJob(jobId, { 
      status: "failed", 
      error: error instanceof Error ? error.message : "Unknown error",
      completedAt: new Date() 
    });

    // Update video status
    await storage.updateVideo(videoId, { status: "failed" });

    throw error;
  }
});

// Job event listeners
jobQueue.on("completed", (job, result) => {
  console.log(`Job ${job.id} completed successfully`);
});

jobQueue.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed:`, err);
});

jobQueue.on("progress", (job, progress) => {
  console.log(`Job ${job.id} progress: ${progress}%`);
});

// Get worker statistics
export async function getWorkerStats() {
  try {
    const waiting = await jobQueue.getWaitingCount();
    const active = await jobQueue.getActiveCount();
    const completed = await jobQueue.getCompletedCount();
    const failed = await jobQueue.getFailedCount();
    const activeJobs = await jobQueue.getActive();

    return {
      waiting,
      active,
      completed,
      failed,
      workers: activeJobs.map((job: any, index: number) => ({
        id: `worker-${index + 1}`,
        status: "processing",
        jobId: job.id,
        progress: job.progress(),
      }))
    };
  } catch (error) {
    console.error("Error getting worker stats:", error);
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      workers: []
    };
  }
}
