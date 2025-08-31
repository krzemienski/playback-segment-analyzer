import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import JobTable from "@/components/jobs/job-table";
import { JobVisualizer } from "@/components/jobs/job-visualizer";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Activity, CheckCircle, XCircle, Clock } from "lucide-react";

export default function Jobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isConnected, lastMessage } = useWebSocket();

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 5000, // Reduced frequency since we have WebSocket updates
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      const messageTypes = ['job_created', 'job_progress', 'job_completed', 'job_failed', 'job_cancelled', 'job_retried'];
      if (messageTypes.includes(lastMessage.type)) {
        // Invalidate the query to refresh job list
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      }
    }
  }, [lastMessage, queryClient]);

  const cancelJobMutation = useMutation({
    mutationFn: (jobId: string) => 
      fetch(`/api/jobs/${jobId}/cancel`, { method: 'POST' }).then(res => {
        if (!res.ok) throw new Error('Failed to cancel job');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Job cancelled",
        description: "The job has been successfully cancelled.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to cancel the job. Please try again.",
        variant: "destructive",
      });
    },
  });

  const retryJobMutation = useMutation({
    mutationFn: (jobId: string) => 
      fetch(`/api/jobs/${jobId}/retry`, { method: 'POST' }).then(res => {
        if (!res.ok) throw new Error('Failed to retry job');
        return res.json();
      }),
    onSuccess: () => {
      toast({
        title: "Job retried",
        description: "The job has been added back to the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to retry the job. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="p-6 space-y-6" data-testid="jobs-page">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Job Queue Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Monitor and manage video processing jobs
              </p>
            </div>
            <Badge variant={isConnected ? 'default' : 'destructive'} data-testid="ws-connected">
              {isConnected ? (
                <><Activity className="h-3 w-3 mr-1" /> Live</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Disconnected</>
              )}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <JobVisualizer 
              jobs={jobs}
              onCancel={(jobId) => cancelJobMutation.mutate(jobId)}
              onRetry={(jobId) => retryJobMutation.mutate(jobId)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
