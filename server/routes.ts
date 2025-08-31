import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { storage } from "./storage";
import { insertVideoSchema, insertJobSchema } from "@shared/schema";
import { jobQueue, getWorkerStats, setBroadcast } from "./services/job-queue";
import { z } from "zod";

const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 * 1024, // 10GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, AVI, MOV, and MKV files are allowed.'));
    }
  }
});

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

  app.post('/api/videos/upload', upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No video file provided' });
      }

      const videoData = insertVideoSchema.parse({
        filename: req.file.filename,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        format: path.extname(req.file.originalname).substring(1),
        status: 'uploaded',
        uploadedBy: null, // TODO: Get from authenticated user
      });

      const video = await storage.createVideo(videoData);
      
      // Create scene detection job
      const jobData = insertJobSchema.parse({
        videoId: video.id,
        type: 'scene_detection',
        status: 'queued',
        data: { filename: req.file.filename, originalName: req.file.originalname },
      });

      const job = await storage.createJob(jobData);
      
      // Add job to queue
      await jobQueue.add('process-video', {
        jobId: job.id,
        videoId: video.id,
        filename: req.file.filename,
        type: 'scene_detection',
      });

      // Broadcast update
      broadcast({
        type: 'video_uploaded',
        data: { video, job },
      });

      res.json({ video, job });
    } catch (error) {
      console.error('Error uploading video:', error);
      res.status(500).json({ error: 'Failed to upload video' });
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
