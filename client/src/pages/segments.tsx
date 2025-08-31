import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TimelineScrubber from "@/components/video/timeline-scrubber";
import { Download, RotateCcw, Play, X } from "lucide-react";
import { useState } from "react";

export default function Segments() {
  const { videoId } = useParams();
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [currentSegment, setCurrentSegment] = useState<any>(null);

  const { data: video, isLoading: videoLoading } = useQuery<any>({
    queryKey: ["/api/videos", videoId],
    enabled: !!videoId,
  });

  const { data: scenes = [], isLoading: scenesLoading } = useQuery<any[]>({
    queryKey: ["/api/videos", videoId, "scenes"],
    enabled: !!videoId,
  });

  if (videoLoading || scenesLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-20 bg-muted rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!video && videoId) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Video not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" data-testid="segments-page">
      {/* Video Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-card-foreground mb-2" data-testid="video-title">
                {video?.originalName || "Select a video"}
              </h2>
              {video && (
                <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                  <span>Duration: {video.metadata?.duration ? `${video.metadata.duration}s` : "Unknown"}</span>
                  <span>Resolution: {video.metadata?.resolution || "Unknown"}</span>
                  <span>FPS: {video.metadata?.fps || "Unknown"}</span>
                  <span>Size: {video.fileSize ? `${(video.fileSize / (1024 * 1024 * 1024)).toFixed(1)} GB` : "Unknown"}</span>
                </div>
              )}
            </div>
            {video && (
              <div className="flex space-x-2">
                <Button data-testid="export-button">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" data-testid="reprocess-button">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reprocess
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {!videoId ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              Select a video from the Videos page to view its scene detection results.
            </p>
          </CardContent>
        </Card>
      ) : scenes.length > 0 ? (
        <>
          {/* Video Timeline Scrubber */}
          <Card>
            <CardHeader>
              <CardTitle>Scene Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <TimelineScrubber 
                scenes={scenes.map((s: any) => ({
                  id: s.id,
                  startTime: String(s.startTime),
                  endTime: String(s.endTime),
                  confidence: String(s.confidence)
                }))} 
                duration={video?.metadata?.duration || 0}
              />
              <p className="text-sm text-muted-foreground mt-3 flex items-center">
                <span className="inline-block w-2 h-2 bg-destructive rounded-full mr-2"></span>
                Found {scenes.length} scene transitions. Click on markers to preview segments.
              </p>
            </CardContent>
          </Card>

          {/* Scene Segments Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Detected Segments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="segments-grid">
                {scenes.map((scene: any, index: number) => (
                  <div 
                    key={scene.id}
                    className="segment-preview bg-secondary rounded-lg overflow-hidden"
                    data-testid={`segment-${index}`}
                  >
                    {scene.thumbnailUrl ? (
                      <img 
                        src={scene.thumbnailUrl} 
                        alt={`Scene ${index + 1}`}
                        className="w-full h-32 object-cover" 
                      />
                    ) : (
                      <div className="w-full h-32 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No thumbnail</span>
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-secondary-foreground">
                          Segment {index + 1}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          Score: {parseFloat(scene.confidence).toFixed(2)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(scene.startTime).toFixed(1)}s - {parseFloat(scene.endTime).toFixed(1)}s
                        ({(parseFloat(scene.endTime) - parseFloat(scene.startTime)).toFixed(1)}s)
                      </p>
                      <div className="flex space-x-2 mt-3">
                        <Button 
                          size="sm" 
                          className="flex-1" 
                          data-testid={`preview-segment-${index}`}
                          onClick={() => {
                            setCurrentSegment(scene);
                            setShowVideoPlayer(true);
                          }}
                        >
                          <Play className="h-3 w-3 mr-1" />
                          Preview
                        </Button>
                        <Button size="sm" variant="outline" data-testid={`download-segment-${index}`}>
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No scenes detected for this video. The video may still be processing.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video Player Modal */}
      {showVideoPlayer && video && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {currentSegment ? 
                  `Segment Preview (${parseFloat(currentSegment.startTime).toFixed(1)}s - ${parseFloat(currentSegment.endTime).toFixed(1)}s)` : 
                  'Video Preview'
                }
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowVideoPlayer(false);
                  setCurrentSegment(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <video
                controls
                autoPlay
                className="w-full rounded-lg"
                src={`/api/videos/${video.id}/stream`}
                onLoadedMetadata={(e) => {
                  if (currentSegment) {
                    const videoElement = e.target as HTMLVideoElement;
                    videoElement.currentTime = parseFloat(currentSegment.startTime);
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
