import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Video, Briefcase, Scissors, HardDrive, Server, Database, Activity } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery<{
    totalVideos: string;
    videosThisMonth: string;
    activeJobs: string;
    processingJobs: string;
    queuedJobs: string;
    totalSegments: string;
    avgSegmentsPerVideo: string;
    storageUsed: string;
    storagePercent: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: jobs = [] } = useQuery<any[]>({
    queryKey: ["/api/jobs", { status: "processing", limit: 3 }],
    refetchInterval: 2000, // Refresh every 2 seconds for live jobs
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8" data-testid="dashboard-page">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="stat-total-videos">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Videos</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {stats?.totalVideos || 0}
                </p>
              </div>
              <Video className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-green-600">+{stats?.videosThisMonth || 0}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-active-jobs">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {stats?.activeJobs || 0}
                </p>
              </div>
              <Briefcase className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-blue-600">{stats?.processingJobs || 0} processing</span>, {stats?.queuedJobs || 0} queued
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-segments-found">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Segments Found</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {stats?.totalSegments || 0}
                </p>
              </div>
              <Scissors className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Avg <span className="font-medium">{stats?.avgSegmentsPerVideo || 0}</span> per video
            </p>
          </CardContent>
        </Card>

        <Card data-testid="stat-storage-used">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Storage Used</p>
                <p className="text-3xl font-bold text-card-foreground">
                  {stats?.storageUsed || "0GB"}
                </p>
              </div>
              <HardDrive className="h-8 w-8 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="text-orange-600">{stats?.storagePercent || 0}%</span> of capacity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Live Processing Jobs and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Job Processing */}
        <Card data-testid="live-processing-jobs">
          <CardHeader>
            <CardTitle>Live Processing Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  No active processing jobs
                </p>
              )}
              {jobs.map((job: any) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Video className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-secondary-foreground">
                        {job.video?.originalName || 'Unknown video'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {job.type?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-secondary-foreground">
                      {job.progress}%
                    </p>
                    <Progress value={job.progress} className="w-20 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card data-testid="system-health">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Server className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-medium text-card-foreground">API Server</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Uptime: 99.9%</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <p className="font-medium text-card-foreground">Database</p>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Healthy
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">Response: 12ms</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Activity className="h-8 w-8 text-orange-600" />
                </div>
                <p className="font-medium text-card-foreground">Job Queue</p>
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  High Load
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">{stats?.queuedJobs || 0} jobs pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
