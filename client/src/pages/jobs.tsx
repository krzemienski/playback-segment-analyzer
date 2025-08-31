import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import JobTable from "@/components/jobs/job-table";
import { useToast } from "@/hooks/use-toast";

export default function Jobs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/jobs"],
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
  });

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
          <CardTitle>Job Queue Management</CardTitle>
          <p className="text-sm text-muted-foreground">
            Monitor and manage video processing jobs
          </p>
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
          ) : jobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No jobs found.</p>
            </div>
          ) : (
            <JobTable 
              jobs={jobs}
              onCancel={(jobId) => cancelJobMutation.mutate(jobId)}
              onRetry={(jobId) => retryJobMutation.mutate(jobId)}
              isLoading={cancelJobMutation.isPending || retryJobMutation.isPending}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
