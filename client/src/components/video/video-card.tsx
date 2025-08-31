import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Link } from "wouter";
import { Video, Eye } from "lucide-react";

interface VideoCardProps {
  video: {
    id: string;
    originalName: string;
    duration?: string;
    fileSize: number;
    status: string;
    progress?: number;
    scenes?: any[];
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-600 border-green-600";
      case "processing": return "text-blue-600 border-blue-600";
      case "failed": return "text-red-600 border-red-600";
      default: return "text-gray-600 border-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "Processed";
      case "processing": return "Processing";
      case "failed": return "Failed";
      case "uploaded": return "Uploaded";
      default: return status;
    }
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`video-card-${video.id}`}>
      {/* Video thumbnail placeholder */}
      <div className="w-full h-36 bg-muted flex items-center justify-center">
        <Video className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <CardContent className="p-4">
        <h4 className="font-medium text-card-foreground mb-2 truncate" data-testid="video-title">
          {video.originalName}
        </h4>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
          <span>{video.duration || "Unknown"} duration</span>
          <span>{formatFileSize(video.fileSize)}</span>
        </div>

        {video.status === "processing" && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Processing</span>
              <span>{video.progress || 0}%</span>
            </div>
            <Progress value={video.progress || 0} className="h-2" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              video.status === "completed" ? "bg-green-500" :
              video.status === "processing" ? "bg-blue-500" :
              video.status === "failed" ? "bg-red-500" :
              "bg-gray-500"
            }`} />
            <Badge variant="outline" className={getStatusColor(video.status)}>
              {getStatusText(video.status)}
            </Badge>
          </div>
          
          {video.status === "completed" ? (
            <Link href={`/segments/${video.id}`}>
              <Button variant="ghost" size="sm" data-testid="view-scenes-button">
                <Eye className="h-4 w-4 mr-1" />
                View Scenes
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" disabled data-testid="view-progress-button">
              View Progress
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
