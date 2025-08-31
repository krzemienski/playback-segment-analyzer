import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Eye, RotateCcw, X, FileText } from "lucide-react";

interface Job {
  id: string;
  videoId: string;
  type: string;
  status: string;
  progress: number;
  error?: string;
  startedAt?: string;
  video?: {
    originalName: string;
  };
}

interface JobTableProps {
  jobs: Job[];
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  isLoading: boolean;
}

export default function JobTable({ jobs, onCancel, onRetry, isLoading }: JobTableProps) {
  const getStatusBadge = (status: string) => {
    const variants = {
      processing: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      queued: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      completed: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      failed: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      cancelled: "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400",
    };

    return (
      <Badge 
        variant="outline" 
        className={`${variants[status as keyof typeof variants] || variants.queued} border-0`}
      >
        {status === "processing" && (
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1.5 processing-animation"></div>
        )}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatJobType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="overflow-x-auto" data-testid="job-table">
      <table className="w-full">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Job ID</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Video</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Type</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Status</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Progress</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Started</th>
            <th className="text-left py-3 px-6 text-sm font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-muted/30" data-testid={`job-row-${job.id}`}>
              <td className="py-4 px-6">
                <span className="font-mono text-sm text-muted-foreground">
                  #{job.id.slice(-8)}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="font-medium text-card-foreground">
                  {job.video?.originalName || 'Unknown video'}
                </span>
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-muted-foreground">
                  {formatJobType(job.type)}
                </span>
              </td>
              <td className="py-4 px-6">
                {getStatusBadge(job.status)}
              </td>
              <td className="py-4 px-6">
                {job.status === "processing" || job.status === "completed" ? (
                  <div className="flex items-center space-x-2">
                    <Progress value={job.progress} className="w-24" />
                    <span className="text-sm text-muted-foreground">{job.progress}%</span>
                  </div>
                ) : job.status === "failed" ? (
                  <span className="text-sm text-red-600">Error</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Waiting...</span>
                )}
              </td>
              <td className="py-4 px-6">
                <span className="text-sm text-muted-foreground">
                  {formatTime(job.startedAt)}
                </span>
              </td>
              <td className="py-4 px-6">
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`view-job-${job.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {job.status === "failed" && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onRetry(job.id)}
                      disabled={isLoading}
                      data-testid={`retry-job-${job.id}`}
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  
                  {(job.status === "processing" || job.status === "queued") && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onCancel(job.id)}
                      disabled={isLoading}
                      data-testid={`cancel-job-${job.id}`}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`logs-job-${job.id}`}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Logs
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
