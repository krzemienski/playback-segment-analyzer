import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import UploadZone from "@/components/video/upload-zone";
import { useToast } from "@/hooks/use-toast";
import { Video, Check, Play } from "lucide-react";

interface UploadItem {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "failed";
  videoId?: string;
  jobId?: string;
}

export default function Upload() {
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('video', file);

      return fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Upload failed');
        return res.json();
      });
    },
    onSuccess: (data, file) => {
      setUploadQueue(prev => prev.map(item => 
        item.file === file 
          ? { ...item, status: "completed", progress: 100, videoId: data.video.id, jobId: data.job.id }
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
