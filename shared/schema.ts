import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, jsonb, boolean, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileSize: integer("file_size").notNull(),
  duration: decimal("duration", { precision: 10, scale: 2 }),
  resolution: text("resolution"),
  fps: integer("fps"),
  format: text("format").notNull(),
  status: text("status").notNull().default("uploaded"), // uploaded, processing, completed, failed
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("videos_status_idx").on(table.status),
  createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
}));

export const jobs = pgTable("jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id).notNull(),
  type: text("type").notNull(), // scene_detection, preview_generation, thumbnail_extraction
  status: text("status").notNull().default("queued"), // queued, processing, completed, failed, cancelled
  progress: integer("progress").default(0).notNull(),
  data: jsonb("data"), // job-specific configuration and results
  error: text("error"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  statusIdx: index("jobs_status_idx").on(table.status),
  videoIdIdx: index("jobs_video_id_idx").on(table.videoId),
  typeIdx: index("jobs_type_idx").on(table.type),
}));

export const scenes = pgTable("scenes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").references(() => videos.id).notNull(),
  jobId: varchar("job_id").references(() => jobs.id).notNull(),
  startTime: decimal("start_time", { precision: 10, scale: 2 }).notNull(),
  endTime: decimal("end_time", { precision: 10, scale: 2 }).notNull(),
  confidence: decimal("confidence", { precision: 5, scale: 4 }).notNull(),
  thumbnailUrl: text("thumbnail_url"),
  metadata: jsonb("metadata"), // additional scene analysis data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  videoIdIdx: index("scenes_video_id_idx").on(table.videoId),
  startTimeIdx: index("scenes_start_time_idx").on(table.startTime),
}));

export const systemMetrics = pgTable("system_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(), // cpu, memory, disk, network
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
}, (table) => ({
  typeTimestampIdx: index("metrics_type_timestamp_idx").on(table.metricType, table.timestamp),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [videos.uploadedBy],
    references: [users.id],
  }),
  jobs: many(jobs),
  scenes: many(scenes),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  video: one(videos, {
    fields: [jobs.videoId],
    references: [videos.id],
  }),
  scenes: many(scenes),
}));

export const scenesRelations = relations(scenes, ({ one }) => ({
  video: one(videos, {
    fields: [scenes.videoId],
    references: [videos.id],
  }),
  job: one(jobs, {
    fields: [scenes.jobId],
    references: [jobs.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
  startedAt: true,
  completedAt: true,
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
});

export const insertSystemMetricSchema = createInsertSchema(systemMetrics).omit({
  id: true,
  timestamp: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;

export type SystemMetric = typeof systemMetrics.$inferSelect;
export type InsertSystemMetric = z.infer<typeof insertSystemMetricSchema>;
