// In-memory queue implementation for development/testing
// This replaces Redis-based Bull queue when Redis is not available

interface Job {
  id: string;
  data: any;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  processor?: string;
}

class InMemoryQueue {
  private jobs: Map<string, Job> = new Map();
  private processors: Map<string, (job: any) => Promise<any>> = new Map();
  private jobCounter = 0;
  private isProcessing = false;

  async add(processor: string, data: any): Promise<Job> {
    const jobId = `job-${++this.jobCounter}`;
    const job: Job = {
      id: jobId,
      data,
      status: 'waiting',
      progress: 0,
      processor,
    };
    
    this.jobs.set(jobId, job);
    console.log(`[InMemoryQueue] Job ${jobId} added to queue`);
    
    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
    
    return job;
  }

  process(name: string, handler: (job: any) => Promise<any>) {
    this.processors.set(name, handler);
    console.log(`[InMemoryQueue] Processor registered for: ${name}`);
  }

  private async startProcessing() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (true) {
      const waitingJob = Array.from(this.jobs.values()).find(j => j.status === 'waiting');
      
      if (!waitingJob) {
        this.isProcessing = false;
        break;
      }
      
      await this.processJob(waitingJob);
    }
  }

  private async processJob(job: Job) {
    const processor = this.processors.get(job.processor || '');
    
    if (!processor) {
      console.error(`[InMemoryQueue] No processor found for: ${job.processor}`);
      job.status = 'failed';
      job.error = `No processor found for: ${job.processor}`;
      return;
    }
    
    try {
      console.log(`[InMemoryQueue] Processing job ${job.id}`);
      job.status = 'processing';
      
      const mockJob = {
        id: job.id,
        data: job.data,
        progress: (value: number) => {
          job.progress = value;
          console.log(`[InMemoryQueue] Job ${job.id} progress: ${value}%`);
        }
      };
      
      const result = await processor(mockJob);
      
      job.status = 'completed';
      job.progress = 100;
      job.result = result;
      console.log(`[InMemoryQueue] Job ${job.id} completed`);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[InMemoryQueue] Job ${job.id} failed:`, error);
    }
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async getWaitingCount(): Promise<number> {
    return Array.from(this.jobs.values()).filter(j => j.status === 'waiting').length;
  }

  async getActiveCount(): Promise<number> {
    return Array.from(this.jobs.values()).filter(j => j.status === 'processing').length;
  }

  async getCompletedCount(): Promise<number> {
    return Array.from(this.jobs.values()).filter(j => j.status === 'completed').length;
  }

  async getFailedCount(): Promise<number> {
    return Array.from(this.jobs.values()).filter(j => j.status === 'failed').length;
  }

  async getActive(): Promise<any[]> {
    return Array.from(this.jobs.values())
      .filter(j => j.status === 'processing')
      .map(j => ({
        id: j.id,
        data: j.data,
        progress: () => j.progress,
      }));
  }

  on(event: string, handler: (job: any, progress?: number) => void) {
    console.log(`[InMemoryQueue] Event listener registered for: ${event}`);
  }
}

export const inMemoryQueue = new InMemoryQueue();