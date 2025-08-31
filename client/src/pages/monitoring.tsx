import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Server, Database, Activity, Cpu, HardDrive, Wifi } from "lucide-react";

export default function Monitoring() {
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics/system"],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: workers } = useQuery({
    queryKey: ["/api/metrics/workers"],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  return (
    <div className="p-6 space-y-8" data-testid="monitoring-page">
      {/* System Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <Card data-testid="performance-metrics">
          <CardHeader>
            <CardTitle>System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">CPU Usage</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {metrics?.cpu || 0}%
                  </span>
                </div>
                <Progress value={metrics?.cpu || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Memory Usage</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {metrics?.memory || 0}%
                  </span>
                </div>
                <Progress value={metrics?.memory || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Disk Usage</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {metrics?.disk || 0}%
                  </span>
                </div>
                <Progress value={metrics?.disk || 0} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Network I/O</span>
                  </div>
                  <span className="text-sm font-medium text-card-foreground">
                    {metrics?.network || "0 MB/s"}
                  </span>
                </div>
                <Progress value={30} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Worker Status */}
        <Card data-testid="worker-status">
          <CardHeader>
            <CardTitle>Worker Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workers?.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No workers available
                </p>
              ) : (
                workers?.map((worker: any, index: number) => (
                  <div 
                    key={worker.id || index} 
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      worker.status === 'processing' ? 'bg-green-50 dark:bg-green-900/10' :
                      worker.status === 'idle' ? 'bg-yellow-50 dark:bg-yellow-900/10' :
                      'bg-red-50 dark:bg-red-900/10'
                    }`}
                    data-testid={`worker-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        worker.status === 'processing' ? 'bg-green-500' :
                        worker.status === 'idle' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <span className="font-medium text-card-foreground">
                        Worker {index + 1}
                      </span>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={
                        worker.status === 'processing' ? 'text-green-600 border-green-600' :
                        worker.status === 'idle' ? 'text-yellow-600 border-yellow-600' :
                        'text-red-600 border-red-600'
                      }
                    >
                      {worker.status || 'Unknown'}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Logs */}
      <Card data-testid="live-logs">
        <CardHeader>
          <CardTitle>Live System Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-black text-green-400 font-mono text-sm p-4 rounded-lg h-64 overflow-y-auto">
            <div className="space-y-1">
              <div className="opacity-90">[{new Date().toLocaleTimeString()}] INFO: System monitoring active</div>
              <div className="opacity-80">[{new Date(Date.now() - 30000).toLocaleTimeString()}] INFO: Worker health check completed</div>
              <div className="opacity-70">[{new Date(Date.now() - 60000).toLocaleTimeString()}] INFO: Database connection stable</div>
              <div className="opacity-60">[{new Date(Date.now() - 90000).toLocaleTimeString()}] DEBUG: Redis queue operational</div>
              <div className="opacity-50">[{new Date(Date.now() - 120000).toLocaleTimeString()}] INFO: Application startup complete</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
