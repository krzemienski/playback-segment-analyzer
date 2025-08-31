import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertVideoSchema, insertJobSchema } from "@shared/schema";
import { jobQueue, getWorkerStats, setBroadcast } from "./services/job-queue";
import { z } from "zod";
import { ObjectStorageService, ObjectNotFoundError } from './objectStorage';
import { ObjectPermission } from './objectAcl';

// Multer is no longer needed for object storage uploads
// We'll use presigned URLs instead

interface WebSocketClient extends WebSocket {
  id: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocketClient>();

  wss.on('connection', (ws: WebSocketClient) => {
    ws.id = Math.random().toString(36).substring(7);
    clients.add(ws);
    
    ws.on('close', () => {
      clients.delete(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast function for real-time updates
  function broadcast(data: any) {
    const message = JSON.stringify(data);
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
  // Inject broadcast function into job queue for real-time updates
  setBroadcast(broadcast);

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Video routes
  app.get('/api/videos', async (req, res) => {
    try {
      const { status, search, limit = 20, offset = 0 } = req.query;
      const videos = await storage.getVideos({
        status: status as string,
        search: search as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      res.status(500).json({ error: 'Failed to fetch videos' });
    }
  });

  app.get('/api/videos/:id', async (req, res) => {
    try {
      const video = await storage.getVideo(req.params.id);
      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }
      res.json(video);
    } catch (error) {
      console.error('Error fetching video:', error);
      res.status(500).json({ error: 'Failed to fetch video' });
    }
  });

  // Get presigned URL for video upload
  app.post('/api/videos/upload-url', async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error: any) {
      console.error('Error getting upload URL:', error);
      res.status(500).json({ error: error.message || 'Failed to get upload URL' });
    }
  });

  // Process uploaded video metadata
  app.post('/api/videos/process-upload', async (req, res) => {
    try {
      const { uploadURL, filename, fileSize } = req.body;
      
      if (!uploadURL || !filename || !fileSize) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Extract format from filename
      let format = path.extname(filename).substring(1).toLowerCase();
      if (!format || !['mp4', 'avi', 'mov', 'mkv'].includes(format)) {
        format = 'mp4'; // Default format if extension is missing or unknown
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        uploadURL,
        {
          owner: 'system', // TODO: Get from authenticated user
          visibility: 'private', // Videos are private by default
        }
      );

      const videoData = insertVideoSchema.parse({
        filename: objectPath,
        originalName: filename,
        fileSize: fileSize,
        format: format,
        status: 'uploaded',
        uploadedBy: null, // TODO: Get from authenticated user
      });

      const video = await storage.createVideo(videoData);
      
      // Create scene detection job
      const jobData = insertJobSchema.parse({
        videoId: video.id,
        type: 'scene_detection',
        status: 'queued',
        data: { filename: objectPath, originalName: filename },
      });

      const job = await storage.createJob(jobData);
      
      // Add job to queue
      await jobQueue.add('process-video', {
        jobId: job.id,
        videoId: video.id,
        filename: objectPath,
        type: 'scene_detection',
      });

      // Broadcast update
      broadcast({
        type: 'video_uploaded',
        data: { video, job },
      });

      console.log('Upload processed:', { videoId: video.id, jobId: job.id, objectPath });
      res.json({ video, job });
    } catch (error: any) {
      console.error('Error processing upload:', error);
      if (error instanceof z.ZodError) {
        console.error('Schema validation error:', error.errors);
        return res.status(400).json({ error: 'Invalid video data', details: error.errors });
      }
      res.status(500).json({ error: error.message || 'Failed to process upload' });
    }
  });

  // Serve private video files from object storage
  app.get('/objects/:objectPath(*)', async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      // For now, allow access without authentication
      // TODO: Implement proper authentication
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error('Error accessing object:', error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Serve public objects (thumbnails, etc.)
  app.get('/public-objects/:filePath(*)', async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: 'File not found' });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error('Error searching for public object:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });
  

  // Job routes
  app.get('/api/jobs', async (req, res) => {
    try {
      const { status, type, limit = 50, offset = 0 } = req.query;
      const jobs = await storage.getJobs({
        status: status as string,
        type: type as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      });
      res.json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ error: 'Failed to fetch jobs' });
    }
  });

  app.get('/api/jobs/:id', async (req, res) => {
    try {
      const job = await storage.getJob(req.params.id);
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      res.json(job);
    } catch (error) {
      console.error('Error fetching job:', error);
      res.status(500).json({ error: 'Failed to fetch job' });
    }
  });

  app.post('/api/jobs/:id/cancel', async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, { status: 'cancelled' });
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Broadcast update
      broadcast({
        type: 'job_cancelled',
        data: job,
      });

      res.json(job);
    } catch (error) {
      console.error('Error cancelling job:', error);
      res.status(500).json({ error: 'Failed to cancel job' });
    }
  });

  app.post('/api/jobs/:id/retry', async (req, res) => {
    try {
      const job = await storage.updateJob(req.params.id, { 
        status: 'queued',
        progress: 0,
        error: null,
        startedAt: null,
        completedAt: null,
      });
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Add job back to queue
      await jobQueue.add('process-video', {
        jobId: job.id,
        videoId: job.videoId,
        type: job.type,
      });

      // Broadcast update
      broadcast({
        type: 'job_retried',
        data: job,
      });

      res.json(job);
    } catch (error) {
      console.error('Error retrying job:', error);
      res.status(500).json({ error: 'Failed to retry job' });
    }
  });

  // Scene routes
  app.get('/api/videos/:videoId/scenes', async (req, res) => {
    try {
      const scenes = await storage.getScenesByVideoId(req.params.videoId);
      res.json(scenes);
    } catch (error) {
      console.error('Error fetching scenes:', error);
      res.status(500).json({ error: 'Failed to fetch scenes' });
    }
  });

  // System metrics routes
  app.get('/api/metrics/system', async (req, res) => {
    try {
      const { type, hours = 24 } = req.query;
      const metrics = await storage.getSystemMetrics({
        type: type as string,
        hours: parseInt(hours as string),
      });
      res.json(metrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
      res.status(500).json({ error: 'Failed to fetch system metrics' });
    }
  });

  app.get('/api/metrics/workers', async (req, res) => {
    try {
      const workerStats = await getWorkerStats();
      res.json(workerStats);
    } catch (error) {
      console.error('Error fetching worker stats:', error);
      res.status(500).json({ error: 'Failed to fetch worker stats' });
    }
  });

  // Health check
  app.get('/api/health', async (req, res) => {
    try {
      const health = await storage.getHealthStatus();
      res.json(health);
    } catch (error) {
      console.error('Error checking health:', error);
      res.status(500).json({ error: 'Health check failed' });
    }
  });

  // Job progress updates (called by workers)
  app.post('/api/jobs/:id/progress', async (req, res) => {
    try {
      const { progress, status, error } = req.body;
      
      const updateData: any = { progress };
      if (status) updateData.status = status;
      if (error) updateData.error = error;
      if (status === 'processing' && !updateData.startedAt) {
        updateData.startedAt = new Date();
      }
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }

      const job = await storage.updateJob(req.params.id, updateData);
      
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      // Broadcast real-time update
      broadcast({
        type: 'job_progress',
        data: job,
      });

      res.json(job);
    } catch (error) {
      console.error('Error updating job progress:', error);
      res.status(500).json({ error: 'Failed to update job progress' });
    }
  });

  return httpServer;
}
