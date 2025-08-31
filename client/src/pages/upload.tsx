import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UploadZone from "@/components/video/upload-zone";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Video, Check, Play, Settings2, X } from "lucide-react";

interface UploadItem {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  videoId?: string;
  jobId?: string;
}

export default function Upload() {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [config, setConfig] = useState({
    threshold: 0.3,
    minSceneLength: 1.0,
    algorithm: 'content_detect'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  // Handle WebSocket messages for real-time job progress
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'job_progress') {
      const job = lastMessage.data?.job;
      if (job) {
        setUploadQueue(prev => prev.map(item => {
          if (item.jobId === job.id) {
            return { ...item, progress: job.progress || item.progress };
          }
          return item;
        }));
      }
    }
  }, [lastMessage]);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('config', JSON.stringify(config));

      // Simulate upload progress using XMLHttpRequest for better progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = Math.round((e.loaded / e.total) * 100);
            setUploadQueue(prev => prev.map(item => 
              item.file === file 
                ? { ...item, progress }
                : item
            ));
          }
        });
        
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve(JSON.parse(xhr.responseText));
          } else {
            reject(new Error('Upload failed'));
          }
        };
        
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('POST', '/api/videos/upload');
        xhr.send(formData);
      });
    },
    onSuccess: (data: any, file) => {
      setUploadQueue(prev => prev.map(item => 
        item.file === file 
          ? { ...item, status: "completed", progress: 100, videoId: data.video?.id, jobId: data.job?.id }
          : item
      ));
      
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and queued for processing.`,
      });

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
    },
    onError: (error, file) => {
      setUploadQueue(prev => prev.map(item => 
        item.file === file 
          ? { ...item, status: "failed", progress: 0 }
          : item
      ));
      
      toast({
        title: "Upload failed",
        description: `Failed to upload ${file.name}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  const handleFilesSelected = (files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({
      file,
      progress: 0,
      status: "uploading",
    }));

    setUploadQueue(prev => [...prev, ...newItems]);

    // Start uploading each file
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
  };

  const startProcessing = async (videoId: string) => {
    try {
      const response = await fetch(`/api/videos/${videoId}/process`, {
        method: 'POST',
      });
      
      if (response.ok) {
        toast({
          title: "Processing started",
          description: "Scene detection has been initiated for this video.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      }
    } catch (error) {
      toast({
        title: "Failed to start processing",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8" data-testid="upload-page">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <UploadZone onFilesSelected={handleFilesSelected} />
        </CardContent>
      </Card>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="h-5 w-5 mr-2" />
            Detection Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="threshold">Detection Threshold</Label>
              <Input
                id="threshold"
                type="number"
                min="0.1"
                max="1.0"
                step="0.1"
                value={config.threshold}
                onChange={(e) => setConfig({
                  ...config,
                  threshold: parseFloat(e.target.value)
                })}
                data-testid="threshold-input"
              />
              <p className="text-xs text-muted-foreground">
                Lower values detect more scenes
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="minScene">Min Scene Length (seconds)</Label>
              <Input
                id="minScene"
                type="number"
                min="0.5"
                max="10"
                step="0.5"
                value={config.minSceneLength}
                onChange={(e) => setConfig({
                  ...config,
                  minSceneLength: parseFloat(e.target.value)
                })}
                data-testid="min-scene-input"
              />
              <p className="text-xs text-muted-foreground">
                Minimum duration for a scene
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="algorithm">Detection Algorithm</Label>
              <Select
                value={config.algorithm}
                onValueChange={(value) => setConfig({ ...config, algorithm: value })}
              >
                <SelectTrigger data-testid="algorithm-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="content_detect">Content Detection</SelectItem>
                  <SelectItem value="threshold_detect">Threshold Detection</SelectItem>
                  <SelectItem value="adaptive_detect">Adaptive Detection</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Algorithm for scene detection
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {uploadQueue.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No uploads in progress. Drop files above to get started.
              </p>
            ) : (
              uploadQueue.map((item, index) => (
                <div 
                  key={`${item.file.name}-${index}`}
                  className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  data-testid={`upload-item-${index}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      item.status === "completed" 
                        ? "bg-green-100 dark:bg-green-900/20" 
                        : item.status === "failed"
                        ? "bg-red-100 dark:bg-red-900/20"
                        : "bg-primary/10"
                    }`}>
                      {item.status === "completed" ? (
                        <Check className="h-6 w-6 text-green-600" />
                      ) : (
                        <Video className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-foreground">
                        {item.file.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {(item.file.size / (1024 * 1024)).toFixed(1)} MB • {
                          item.status === "uploading" ? "Uploading..." :
                          item.status === "completed" ? "Upload complete" :
                          "Upload failed"
                        }
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center space-x-4">
                    {item.status === "uploading" && (
                      <div className="flex items-center space-x-2">
                        <Progress value={item.progress} className="w-32" />
                        <span className="text-sm font-medium text-secondary-foreground">
                          {item.progress}%
                        </span>
                      </div>
                    )}
                    
                    {item.status === "completed" && (
                      <Button 
                        size="sm"
                        onClick={() => item.videoId && startProcessing(item.videoId)}
                        data-testid={`start-processing-${index}`}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Processing
                      </Button>
                    )}
                    
                    {item.status === "failed" && (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
