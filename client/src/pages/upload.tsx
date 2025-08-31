import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Upload, FileVideo, X, CheckCircle2 } from 'lucide-react';
import { ProcessingLoader } from '@/components/ui/animated-loader';

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
}

export default function UploadPage() {
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substring(7);
    
    // Add file to uploading list
    setUploadingFiles(prev => [...prev, {
      id: fileId,
      file,
      progress: 0,
      status: 'uploading'
    }]);

    try {
      // Get presigned URL
      const { uploadURL } = await apiRequest('/api/videos/upload-url', {
        method: 'POST',
      });

      // Upload file directly to storage
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          setUploadingFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, progress } : f
          ));
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('Upload failed'));
        
        xhr.open('PUT', uploadURL);
        xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        xhr.send(file);
      });

      // Update status to processing
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing', progress: 100 } : f
      ));

      // Process the upload on the server
      await apiRequest('/api/videos/process-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uploadURL,
          filename: file.name,
          fileSize: file.size,
        }),
      });

      // Update status to completed
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'completed' } : f
      ));

      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and queued for processing.`,
      });

      // Remove from list after a delay
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 3000);

    } catch (error: any) {
      console.error('Error uploading file:', error);
      
      // Update status to error
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error' } : f
      ));

      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      // Validate file type
      const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/mkv', 'video/quicktime'];
      const validExtensions = ['.mp4', '.avi', '.mov', '.mkv'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported video format.`,
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10GB max)
      if (file.size > 10 * 1024 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the 10GB limit.`,
          variant: "destructive",
        });
        return;
      }

      uploadFile(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8" data-testid="upload-page">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Upload Videos
        </h1>
        <p className="text-muted-foreground mt-2">
          Upload your videos for automatic scene detection and analysis
        </p>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="p-8">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-primary/10 p-6">
                <FileVideo className="h-12 w-12 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-lg font-medium mb-1">Upload your videos</p>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to select files
              </p>
              <p className="text-xs text-muted-foreground">
                Supported formats: MP4, AVI, MOV, MKV (max 10GB)
              </p>
            </div>
            <div className="flex justify-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/mp4,video/avi,video/mov,video/mkv,video/quicktime"
                className="hidden"
                onChange={handleFileSelect}
                data-testid="input-file-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFiles.some(f => f.status === 'uploading')}
                data-testid="button-upload"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select Videos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Uploading Files</h3>
            <div className="space-y-3">
              {uploadingFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                  data-testid={`upload-item-${file.id}`}
                >
                  <FileVideo className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium truncate">
                        {file.file.name}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.file.size)}
                      </span>
                    </div>
                    {file.status === 'uploading' && (
                      <>
                        <Progress value={file.progress} className="h-1 mt-2" />
                        <span className="text-xs text-muted-foreground">
                          {Math.round(file.progress)}%
                        </span>
                      </>
                    )}
                    {file.status === 'processing' && (
                      <span className="text-xs text-muted-foreground">
                        Processing...
                      </span>
                    )}
                  </div>
                  
                  {file.status === 'uploading' && (
                    <ProcessingLoader className="w-6 h-6" />
                  )}
                  
                  {file.status === 'processing' && (
                    <ProcessingLoader className="w-6 h-6" />
                  )}
                  
                  {file.status === 'completed' && (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  )}
                  
                  {file.status === 'error' && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeFile(file.id)}
                      data-testid={`button-remove-${file.id}`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}