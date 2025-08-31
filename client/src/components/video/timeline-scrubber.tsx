interface TimelineScrubberProps {
  scenes: Array<{
    id: string;
    startTime: string;
    endTime: string;
    confidence: string;
  }>;
  duration: number;
  currentTime?: number;
  onTimeChange?: (time: number) => void;
}

export default function TimelineScrubber({ 
  scenes, 
  duration, 
  currentTime = 0, 
  onTimeChange 
}: TimelineScrubberProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMarkerPosition = (time: number) => {
    return duration > 0 ? (time / duration) * 100 : 0;
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimeChange || duration === 0) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    onTimeChange(Math.max(0, Math.min(duration, newTime)));
  };

  return (
    <div className="relative" data-testid="timeline-scrubber">
      {/* Timeline background */}
      <div 
        className="timeline-progress h-16 rounded-lg relative cursor-pointer bg-muted"
        style={{ "--progress": `${(currentTime / duration) * 100}%` } as React.CSSProperties}
        onClick={handleTimelineClick}
      >
        {/* Current time indicator */}
        {currentTime > 0 && (
          <div 
            className="absolute top-0 w-1 h-full bg-primary z-10"
            style={{ left: `${getMarkerPosition(currentTime)}%` }}
          />
        )}
        
        {/* Scene markers */}
        {scenes.map((scene) => (
          <div
            key={scene.id}
            className="scene-marker cursor-pointer hover:bg-destructive/80"
            style={{ left: `${getMarkerPosition(parseFloat(scene.startTime))}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onTimeChange?.(parseFloat(scene.startTime));
            }}
            title={`Scene at ${formatTime(parseFloat(scene.startTime))}`}
            data-testid={`scene-marker-${scene.id}`}
          />
        ))}
      </div>
      
      {/* Time labels */}
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>0:00</span>
        <span>{formatTime(duration * 0.25)}</span>
        <span>{formatTime(duration * 0.5)}</span>
        <span>{formatTime(duration * 0.75)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}
