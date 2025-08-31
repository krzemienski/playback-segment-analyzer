import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWebSocket } from "@/hooks/use-websocket";
import { ProcessingLoader, SceneDetectionAnimation } from "@/components/ui/animated-loader";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap, 
  Film,
  BarChart3,
  TrendingUp,
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  videoId: string;
  type: string;
  status: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  video?: {
    originalName: string;
    fileSize?: number;
    duration?: number;
  };
}

interface JobVisualizerProps {
  jobs: Job[];
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
}

export function JobVisualizer({ jobs, onCancel, onRetry, onPause, onResume }: JobVisualizerProps) {
  const { lastMessage } = useWebSocket();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [animatedProgress, setAnimatedProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (lastMessage?.type === 'job_progress' && lastMessage.data?.job) {
      const job = lastMessage.data.job;
      setAnimatedProgress(prev => ({
        ...prev,
        [job.id]: job.progress || 0
      }));
    }
  }, [lastMessage]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <Activity className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'paused':
        return <PauseCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-red-500";
    if (progress < 60) return "bg-yellow-500";
    if (progress < 90) return "bg-blue-500";
    return "bg-green-500";
  };

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return "—";
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  const activeJobs = jobs.filter(j => j.status === 'processing');
  const queuedJobs = jobs.filter(j => j.status === 'queued');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  return (
    <div className="space-y-6" data-testid="job-visualizer">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeJobs.length}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Queued</p>
                <p className="text-2xl font-bold">{queuedJobs.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedJobs.length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold">{failedJobs.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Jobs with Enhanced Visualization */}
      {activeJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-500" />
              Processing Now
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeJobs.map(job => {
                const progress = animatedProgress[job.id] || job.progress;
                return (
                  <div 
                    key={job.id}
                    className="p-4 bg-secondary/30 rounded-lg border border-primary/20"
                    data-testid={`active-job-${job.id}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Film className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{job.video?.originalName || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">
                            Processing for {formatDuration(job.startedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onPause?.(job.id)}
                          data-testid={`pause-job-${job.id}`}
                        >
                          <PauseCircle className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onCancel(job.id)}
                          data-testid={`cancel-active-job-${job.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Scene Detection Progress</span>
                        <span className="font-mono font-bold">{progress}%</span>
                      </div>
                      <div className="relative h-8 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "absolute inset-y-0 left-0 transition-all duration-500 ease-out rounded-full",
                            getProgressColor(progress)
                          )}
                          style={{ width: `${progress}%` }}
                        >
                          <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                        </div>
                        {progress > 0 && progress < 100 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-1 w-full mx-2">
                              <div className="h-full bg-white/30 rounded animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {progress > 0 && (
                        <div className="flex items-center justify-center mt-2">
                          <SceneDetectionAnimation className="h-20" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queued Jobs */}
      {queuedJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-yellow-500" />
              In Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {queuedJobs.map((job, index) => (
                <div 
                  key={job.id}
                  className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg"
                  data-testid={`queued-job-${job.id}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/20 rounded-full text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{job.video?.originalName || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">
                        Estimated wait: {(index + 1) * 2} minutes
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onCancel(job.id)}
                    data-testid={`cancel-queued-job-${job.id}`}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {[...completedJobs, ...failedJobs]
                .sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime())
                .slice(0, 10)
                .map(job => (
                  <div 
                    key={job.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      job.status === 'completed' ? "bg-green-500/10" : "bg-red-500/10"
                    )}
                    data-testid={`recent-job-${job.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(job.status)}
                      <div>
                        <p className="font-medium">{job.video?.originalName || 'Unknown'}</p>
                        <p className="text-xs text-muted-foreground">
                          {job.completedAt && new Date(job.completedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    {job.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRetry(job.id)}
                        data-testid={`retry-recent-job-${job.id}`}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}