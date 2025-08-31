import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";
import { Plus } from "lucide-react";

const pageConfig = {
  "/": {
    title: "Dashboard",
    subtitle: "Monitor your video processing workflows"
  },
  "/dashboard": {
    title: "Dashboard", 
    subtitle: "Monitor your video processing workflows"
  },
  "/videos": {
    title: "Video Library",
    subtitle: "Manage your uploaded videos and processing results"
  },
  "/jobs": {
    title: "Job Management",
    subtitle: "Monitor and control video processing jobs"
  },
  "/segments": {
    title: "Scene Detection Results",
    subtitle: "Review detected scenes and segments"
  },
  "/upload": {
    title: "Upload Videos",
    subtitle: "Upload new videos for scene detection processing"
  },
  "/monitoring": {
    title: "System Monitoring",
    subtitle: "Real-time system health and performance metrics"
  }
};

export default function Header() {
  const [location] = useLocation();
  const { isConnected } = useWebSocket();
  
  const currentPage = pageConfig[location as keyof typeof pageConfig] || {
    title: "Scene Detection Platform",
    subtitle: "Professional video processing"
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4" data-testid="header">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-card-foreground" data-testid="page-title">
            {currentPage.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1" data-testid="page-subtitle">
            {currentPage.subtitle}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* WebSocket Status Indicator */}
          <div className="flex items-center space-x-2" data-testid="connection-status">
            <div className={`w-2 h-2 rounded-full ${
              isConnected 
                ? "bg-green-500 processing-animation" 
                : "bg-red-500"
            }`} />
            <span className="text-sm text-muted-foreground">
              {isConnected ? "Live" : "Disconnected"}
            </span>
          </div>
          
          {/* Quick Upload Button */}
          <Button 
            className="bg-primary text-primary-foreground hover:opacity-90"
            data-testid="quick-upload-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Quick Upload
          </Button>
        </div>
      </div>
    </header>
  );
}
