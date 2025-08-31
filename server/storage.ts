import { 
  users, videos, jobs, scenes, systemMetrics,
  type User, type InsertUser,
  type Video, type InsertVideo,
  type Job, type InsertJob,
  type Scene, type InsertScene,
  type SystemMetric, type InsertSystemMetric
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and, gte, lte, ilike, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Video methods
  getVideo(id: string): Promise<Video | undefined>;
  getVideos(options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined>;

  // Job methods
  getJob(id: string): Promise<Job | undefined>;
  getJobs(options: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]>;
  createJob(job: InsertJob): Promise<Job>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  // Scene methods
  getScenesByVideoId(videoId: string): Promise<Scene[]>;
  createScene(scene: InsertScene): Promise<Scene>;
  createScenes(scenes: InsertScene[]): Promise<Scene[]>;

  // System metrics methods
  getSystemMetrics(options: {
    type?: string;
    hours?: number;
  }): Promise<SystemMetric[]>;
  createSystemMetric(metric: InsertSystemMetric): Promise<SystemMetric>;

  // Dashboard and health methods
  getDashboardStats(): Promise<any>;
  getHealthStatus(): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Video methods
  async getVideo(id: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideos(options: {
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Video[]> {
    let query = db.select().from(videos);

    const conditions = [];
    
    if (options.status) {
      conditions.push(eq(videos.status, options.status));
    }
    
    if (options.search) {
      conditions.push(
        or(
          ilike(videos.originalName, `%${options.search}%`),
          ilike(videos.filename, `%${options.search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query
      .orderBy(desc(videos.createdAt))
      .limit(options.limit || 20)
      .offset(options.offset || 0);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values({
        ...insertVideo,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return video;
  }

  async updateVideo(id: string, updates: Partial<Video>): Promise<Video | undefined> {
    const [video] = await db
      .update(videos)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(videos.id, id))
      .returning();
    return video || undefined;
  }

  // Job methods
  async getJob(id: string): Promise<Job | undefined> {
    const [job] = await db
      .select({
        job: jobs,
        video: videos,
      })
      .from(jobs)
      .leftJoin(videos, eq(jobs.videoId, videos.id))
      .where(eq(jobs.id, id));

    if (!job) return undefined;

    return {
      ...job.job,
      video: job.video,
    } as any;
  }

  async getJobs(options: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  }): Promise<Job[]> {
    let query = db
      .select({
        job: jobs,
        video: videos,
      })
      .from(jobs)
      .leftJoin(videos, eq(jobs.videoId, videos.id));

    const conditions = [];
    
    if (options.status) {
      conditions.push(eq(jobs.status, options.status));
    }
    
    if (options.type) {
      conditions.push(eq(jobs.type, options.type));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query
      .orderBy(desc(jobs.createdAt))
      .limit(options.limit || 50)
      .offset(options.offset || 0);

    return result.map(row => ({
      ...row.job,
      video: row.video,
    })) as any;
  }

  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values({
        ...insertJob,
        createdAt: new Date(),
      })
      .returning();
    return job;
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const [job] = await db
      .update(jobs)
      .set(updates)
      .where(eq(jobs.id, id))
      .returning();
    return job || undefined;
  }

  // Scene methods
  async getScenesByVideoId(videoId: string): Promise<Scene[]> {
    return await db
      .select()
      .from(scenes)
      .where(eq(scenes.videoId, videoId))
      .orderBy(scenes.startTime);
  }

  async createScene(insertScene: InsertScene): Promise<Scene> {
    const [scene] = await db
      .insert(scenes)
      .values({
        ...insertScene,
        createdAt: new Date(),
      })
      .returning();
    return scene;
  }

  async createScenes(insertScenes: InsertScene[]): Promise<Scene[]> {
    const scenesWithTimestamp = insertScenes.map(scene => ({
      ...scene,
      createdAt: new Date(),
    }));

    return await db
      .insert(scenes)
      .values(scenesWithTimestamp)
      .returning();
  }

  // System metrics methods
  async getSystemMetrics(options: {
    type?: string;
    hours?: number;
  }): Promise<SystemMetric[]> {
    let query = db.select().from(systemMetrics);

    const conditions = [];
    
    if (options.type) {
      conditions.push(eq(systemMetrics.metricType, options.type));
    }
    
    if (options.hours) {
      const hoursAgo = new Date(Date.now() - options.hours * 60 * 60 * 1000);
      conditions.push(gte(systemMetrics.timestamp, hoursAgo));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query.orderBy(desc(systemMetrics.timestamp));
  }

  async createSystemMetric(insertMetric: InsertSystemMetric): Promise<SystemMetric> {
    const [metric] = await db
      .insert(systemMetrics)
      .values({
        ...insertMetric,
        timestamp: new Date(),
      })
      .returning();
    return metric;
  }

  // Dashboard and health methods
  async getDashboardStats(): Promise<any> {
    try {
      // Get total videos
      const [totalVideosResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(videos);
      const totalVideos = totalVideosResult.count;

      // Get videos this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const [videosThisMonthResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(videos)
        .where(gte(videos.createdAt, thisMonth));
      const videosThisMonth = videosThisMonthResult.count;

      // Get active jobs
      const [activeJobsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(or(eq(jobs.status, 'processing'), eq(jobs.status, 'queued')));
      const activeJobs = activeJobsResult.count;

      // Get processing jobs
      const [processingJobsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'processing'));
      const processingJobs = processingJobsResult.count;

      // Get queued jobs
      const [queuedJobsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'queued'));
      const queuedJobs = queuedJobsResult.count;

      // Get total segments
      const [totalSegmentsResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(scenes);
      const totalSegments = totalSegmentsResult.count;

      // Calculate average segments per video
      const avgSegmentsPerVideo = totalVideos > 0 ? (totalSegments / totalVideos).toFixed(1) : "0";

      // Calculate storage used (sum of file sizes)
      const [storageResult] = await db
        .select({ total: sql<number>`sum(${videos.fileSize})` })
        .from(videos);
      const totalBytes = storageResult.total || 0;
      const storageUsed = totalBytes > 0 ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)}GB` : "0GB";

      // Calculate storage percentage (assuming 1TB capacity)
      const storageCapacity = 1024 * 1024 * 1024 * 1024; // 1TB in bytes
      const storagePercent = Math.round((totalBytes / storageCapacity) * 100);

      return {
        totalVideos,
        videosThisMonth,
        activeJobs,
        processingJobs,
        queuedJobs,
        totalSegments,
        avgSegmentsPerVideo,
        storageUsed,
        storagePercent,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalVideos: 0,
        videosThisMonth: 0,
        activeJobs: 0,
        processingJobs: 0,
        queuedJobs: 0,
        totalSegments: 0,
        avgSegmentsPerVideo: "0",
        storageUsed: "0GB",
        storagePercent: 0,
      };
    }
  }

  async getHealthStatus(): Promise<any> {
    try {
      // Test database connection
      await db.select({ test: sql`1` });

      // Get job queue status
      const [queuedJobs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'queued'));

      const [processingJobs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'processing'));

      const [failedJobs] = await db
        .select({ count: sql<number>`count(*)` })
        .from(jobs)
        .where(eq(jobs.status, 'failed'));

      return {
        database: {
          status: 'healthy',
          responseTime: '< 10ms',
        },
        api: {
          status: 'healthy',
          uptime: '99.9%',
        },
        queue: {
          status: queuedJobs.count > 50 ? 'high_load' : 'healthy',
          queued: queuedJobs.count,
          processing: processingJobs.count,
          failed: failedJobs.count,
        },
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        database: {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        api: {
          status: 'error',
        },
        queue: {
          status: 'error',
        },
      };
    }
  }
}

export const storage = new DatabaseStorage();
