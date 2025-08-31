import { useRef, useState } from "react";
import { CloudUpload } from "lucide-react";

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  showBatchOptions?: boolean;
}

export default function UploadZone({ onFilesSelected, maxFiles = 10, showBatchOptions = true }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/')
    );
    
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      data-testid="upload-zone"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />
      
      <CloudUpload className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-card-foreground mb-2">
        Drop your videos here
      </h3>
      <p className="text-muted-foreground mb-4">
        Drag and drop video files, or <span className="text-primary">click to browse</span>
      </p>
      <p className="text-sm text-muted-foreground">
        Supported formats: MP4, AVI, MOV, MKV • Max size: 10GB
      </p>
      {showBatchOptions && (
        <p className="text-xs text-primary mt-2">
          Batch processing: Upload up to {maxFiles} videos at once
        </p>
      )}
    </div>
  );
}
