import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import UploadZone from "@/components/video/upload-zone";
import { UploadPulse } from "@/components/ui/animated-loader";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/use-websocket";
import { Video, Check, Play, Settings2, X, PlayCircle, Trash2, FileStack } from "lucide-react";

interface UploadItem {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  videoId?: string;
  jobId?: string;
}

export default function Upload() {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [autoProcess, setAutoProcess] = useState(true);
  const [config, setConfig] = useState({
    threshold: 0.3,
    minSceneLength: 1.0,
    algorithm: 'content_detect'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  // Listen for Quick Upload events
  useEffect(() => {
    const handleQuickUpload = (event: CustomEvent) => {
      const files = event.detail.files as File[];
      if (files && files.length > 0) {
        handleFilesSelected(files);
      }
    };

    window.addEventListener('quick-upload-files', handleQuickUpload as EventListener);
    return () => {
      window.removeEventListener('quick-upload-files', handleQuickUpload as EventListener);
    };
  }, []);

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

      // Simulate progress for large files
      let progressInterval: NodeJS.Timeout | null = null;
      
      // Start simulated progress
      let simulatedProgress = 0;
      progressInterval = setInterval(() => {
        simulatedProgress = Math.min(simulatedProgress + Math.random() * 15, 90);
        setUploadQueue(prev => prev.map(item => 
          item.file === file 
            ? { ...item, progress: Math.round(simulatedProgress) }
            : item
        ));
      }, 500);

      try {
        // Use fetch API instead of XMLHttpRequest
        const response = await fetch('/api/videos/upload', {
          method: 'POST',
          body: formData,
        });

        if (progressInterval) {
          clearInterval(progressInterval);
        }

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Upload failed');
        }

        const data = await response.json();
        
        // Set progress to 100% on success
        setUploadQueue(prev => prev.map(item => 
          item.file === file 
            ? { ...item, progress: 100 }
            : item
        ));
        
        return data;
      } catch (error) {
        if (progressInterval) {
          clearInterval(progressInterval);
        }
        throw error;
      }
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

    if (batchMode && files.length > 1) {
      toast({
        title: "Batch Upload Started",
        description: `Processing ${files.length} videos in batch mode`,
      });
    }

    // Start uploading each file
    files.forEach(file => {
      uploadMutation.mutate(file);
    });
  };

  const processAllCompleted = () => {
    const completedItems = uploadQueue.filter(item => 
      item.status === "completed" && item.videoId
    );
    
    completedItems.forEach(item => {
      if (item.videoId) {
        startProcessing(item.videoId);
      }
    });
  };

  const clearCompleted = () => {
    setUploadQueue(prev => prev.filter(item => item.status !== "completed"));
  };

  const removeItem = (index: number) => {
    setUploadQueue(prev => prev.filter((_, i) => i !== index));
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

  // Create a test file for debugging
  const createTestFile = () => {
    const testContent = new Blob(
      ['Test video content for debugging'], 
      { type: 'video/mp4' }
    );
    const testFile = new File([testContent], 'test-video.mp4', { 
      type: 'video/mp4',
      lastModified: Date.now()
    });
    handleFilesSelected([testFile]);
    toast({
      title: "Test file created",
      description: "A small test file has been added to the upload queue.",
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8" data-testid="upload-page">
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          {/* Debug button for testing */}
          <div className="mb-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={createTestFile}
              data-testid="create-test-file"
            >
              Create Test File (Debug)
            </Button>
          </div>
          <UploadZone 
            onFilesSelected={handleFilesSelected} 
            maxFiles={batchMode ? 20 : 5}
            showBatchOptions={true}
          />
          {uploadQueue.some(item => item.status === "uploading") && (
            <div className="mt-4 flex justify-center">
              <UploadPulse />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Settings2 className="h-5 w-5 mr-2" />
              Detection Settings
            </span>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="batch-mode"
                  checked={batchMode}
                  onCheckedChange={setBatchMode}
                  data-testid="batch-mode-switch"
                />
                <Label htmlFor="batch-mode" className="text-sm font-normal">
                  Batch Mode
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-process"
                  checked={autoProcess}
                  onCheckedChange={setAutoProcess}
                  data-testid="auto-process-switch"
                />
                <Label htmlFor="auto-process" className="text-sm font-normal">
                  Auto Process
                </Label>
              </div>
            </div>
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
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <FileStack className="h-5 w-5 mr-2" />
              Upload Queue
              {uploadQueue.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {uploadQueue.length} files
                </Badge>
              )}
            </span>
            {uploadQueue.length > 0 && (
              <div className="flex items-center space-x-2">
                {uploadQueue.some(item => item.status === "completed") && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={processAllCompleted}
                      data-testid="process-all-button"
                    >
                      <PlayCircle className="h-4 w-4 mr-1" />
                      Process All
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={clearCompleted}
                      data-testid="clear-completed-button"
                    >
                      Clear Completed
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardTitle>
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
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => item.videoId && startProcessing(item.videoId)}
                          data-testid={`start-processing-${index}`}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Process
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                          data-testid={`remove-item-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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
