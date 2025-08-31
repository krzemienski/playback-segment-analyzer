import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AchievementsSystem } from "@/components/achievements/achievements-system";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Film, 
  Clock, 
  Target,
  Zap,
  Users,
  BarChart3
} from "lucide-react";
import { useState } from "react";

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("7d");
  
  const { data: stats } = useQuery<any>({
    queryKey: ["/api/dashboard/stats"],
    refetchInterval: 30000,
  });

  const { data: analytics } = useQuery<any>({
    queryKey: ["/api/analytics", timeRange],
    refetchInterval: 60000,
  });

  // Mock data for charts - would come from API in production
  const processingTrends = [
    { date: "Mon", videos: 12, segments: 89, time: 45 },
    { date: "Tue", videos: 15, segments: 120, time: 52 },
    { date: "Wed", videos: 18, segments: 145, time: 63 },
    { date: "Thu", videos: 14, segments: 110, time: 48 },
    { date: "Fri", videos: 22, segments: 180, time: 75 },
    { date: "Sat", videos: 19, segments: 150, time: 65 },
    { date: "Sun", videos: 16, segments: 130, time: 55 },
  ];

  const videoFormats = [
    { name: "MP4", count: 45, percentage: 50 },
    { name: "MOV", count: 23, percentage: 25 },
    { name: "AVI", count: 14, percentage: 15 },
    { name: "MKV", count: 9, percentage: 10 },
  ];

  const performanceMetrics = [
    { metric: "Avg Processing Time", value: "2.3 min", change: -15, unit: "per video" },
    { metric: "Detection Accuracy", value: "94.5%", change: 2.3, unit: "scene detection" },
    { metric: "Queue Efficiency", value: "87%", change: 5.1, unit: "utilization" },
    { metric: "Success Rate", value: "98.2%", change: 0.8, unit: "job completion" },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="p-6 space-y-6" data-testid="analytics-page">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your video processing performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32" data-testid="time-range-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="90d">90 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{metric.metric}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <Badge 
                    variant={metric.change > 0 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {metric.change > 0 ? (
                      <><TrendingUp className="h-3 w-3 mr-1" /> +{metric.change}%</>
                    ) : (
                      <><TrendingDown className="h-3 w-3 mr-1" /> {metric.change}%</>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{metric.unit}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Processing Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2 text-blue-500" />
            Processing Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={processingTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="videos" 
                stackId="1"
                stroke="#8884d8" 
                fill="#8884d8" 
                fillOpacity={0.6}
                name="Videos Processed"
              />
              <Area 
                type="monotone" 
                dataKey="segments" 
                stackId="2"
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.6}
                name="Segments Detected"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Video Format Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Film className="h-5 w-5 mr-2 text-purple-500" />
              Format Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={videoFormats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {videoFormats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {videoFormats.map((format, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm">{format.name}</span>
                  </div>
                  <span className="text-sm font-mono">{format.count} videos</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Processing Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-green-500" />
              Processing Time Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={processingTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" fill="#fbbf24" name="Avg Time (min)" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">1.2</p>
                <p className="text-xs text-muted-foreground">Min Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">2.3</p>
                <p className="text-xs text-muted-foreground">Avg Time</p>
              </div>
              <div>
                <p className="text-2xl font-bold">5.8</p>
                <p className="text-xs text-muted-foreground">Max Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-500" />
            System Health & Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Queue Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Active Jobs</span>
                  <span className="font-mono">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Queued Jobs</span>
                  <span className="font-mono">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Completed Today</span>
                  <span className="font-mono">45</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Resource Usage</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span className="font-mono">68%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-mono">4.2 GB</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="font-mono">128 GB</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Error Rates</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Failed Jobs</span>
                  <span className="font-mono text-red-500">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timeout Rate</span>
                  <span className="font-mono">0.5%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Retry Rate</span>
                  <span className="font-mono">1.2%</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Section */}
      <AchievementsSystem userStats={{
        totalVideos: parseInt(stats?.totalVideos || "0"),
        totalSegments: 89,
        totalProcessingTime: 1824,
        streak: 3,
        level: 5,
        experience: 450,
        nextLevelExp: 600
      }} />
    </div>
  );
}