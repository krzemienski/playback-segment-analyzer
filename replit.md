# Scene Detection Platform

## Overview

A modern web application for automated video scene detection and processing. The platform allows users to upload videos, monitor processing jobs in real-time, and review detected scenes with an intuitive interface. Built with a React frontend, Express backend, and PostgreSQL database, the system utilizes job queues for efficient video processing and WebSocket connections for live updates.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and Vite for development
- **UI Components**: Shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom theme variables supporting light/dark modes
- **State Management**: TanStack Query for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket client for live job progress and system metrics

### Backend Architecture
- **Runtime**: Node.js with Express framework and TypeScript
- **API Design**: RESTful endpoints with WebSocket support for real-time features
- **File Handling**: Multer for video file uploads with validation (MP4, AVI, MOV, MKV)
- **Job Processing**: Bull queue system for background video processing tasks
- **Development**: Vite middleware integration for hot module replacement

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Design**:
  - Users table with authentication support
  - Videos table with metadata and processing status
  - Jobs table for tracking processing tasks with progress
  - Scenes table for storing detection results
  - System metrics table for monitoring data
- **Indexing**: Strategic indexes on status, timestamps, and foreign keys for performance

### Authentication & Authorization
- Session-based authentication preparation (schema includes users table)
- File upload restrictions by type and size (10GB limit)
- Basic access control structure in place

### Job Queue System
- **Queue Engine**: Bull with Redis backend
- **Job Types**: Scene detection, preview generation, thumbnail extraction
- **Progress Tracking**: Real-time progress updates via WebSocket
- **Error Handling**: Job retry mechanisms and error logging
- **Status Management**: Queued, processing, completed, failed, cancelled states

### Real-time Communication
- **WebSocket Server**: Integrated with Express HTTP server
- **Client Management**: Connection tracking with automatic reconnection
- **Message Types**: Job progress, system metrics, status updates
- **Error Recovery**: Automatic reconnection with exponential backoff

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Redis**: Job queue backend and caching (configurable host/port/auth)

### UI Component Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, forms, etc.)
- **Shadcn/ui**: Pre-built component library with Tailwind integration
- **Lucide React**: Icon library for consistent iconography

### Development Tools
- **Vite**: Fast development server with HMR and build optimization
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast bundling for production builds
- **Drizzle Kit**: Database migration and schema management

### Processing Libraries
- **Bull**: Robust job queue for background processing
- **IORedis**: Redis client for queue operations
- **Multer**: File upload middleware with validation

### Runtime Dependencies
- **@neondatabase/serverless**: Neon database client with WebSocket support
- **ws**: WebSocket implementation for real-time features
- **TanStack Query**: Data fetching and caching for React
- **Wouter**: Lightweight routing solution