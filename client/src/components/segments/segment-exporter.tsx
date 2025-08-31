import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileJson, 
  FileVideo, 
  FileText, 
  Share2,
  Twitter,
  Facebook,
  Linkedin,
  Copy,
  Check
} from "lucide-react";

interface Segment {
  id: string;
  segmentNumber: number;
  startTime: number;
  endTime: number;
  duration: number;
  sceneScore?: number;
  thumbnailUrl?: string;
}

interface SegmentExporterProps {
  segments: Segment[];
  videoName: string;
  videoId: string;
}

export function SegmentExporter({ segments, videoName, videoId }: SegmentExporterProps) {
  const [exportFormat, setExportFormat] = useState<string>("json");
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const exportAsJSON = () => {
    const data = {
      video: videoName,
      videoId,
      exportDate: new Date().toISOString(),
      totalSegments: segments.length,
      totalDuration: segments.reduce((acc, seg) => acc + seg.duration, 0),
      segments: segments.map(seg => ({
        number: seg.segmentNumber,
        startTime: seg.startTime,
        endTime: seg.endTime,
        duration: seg.duration,
        sceneScore: seg.sceneScore
      }))
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${videoName}_segments.json`);
  };

  const exportAsCSV = () => {
    const headers = ['Segment', 'Start Time', 'End Time', 'Duration', 'Scene Score'];
    const rows = segments.map(seg => [
      seg.segmentNumber,
      seg.startTime.toFixed(2),
      seg.endTime.toFixed(2),
      seg.duration.toFixed(2),
      seg.sceneScore?.toFixed(3) || 'N/A'
    ]);
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    downloadFile(blob, `${videoName}_segments.csv`);
  };

  const exportAsEDL = () => {
    // Export as Edit Decision List for video editing software
    const edl = segments.map((seg, index) => {
      const startTC = secondsToTimecode(seg.startTime);
      const endTC = secondsToTimecode(seg.endTime);
      return `${String(index + 1).padStart(3, '0')}  001      V     C        ${startTC} ${endTC} ${startTC} ${endTC}`;
    }).join('\n');
    
    const blob = new Blob([edl], { type: 'text/plain' });
    downloadFile(blob, `${videoName}.edl`);
  };

  const exportAsPremierePro = () => {
    // Export as FCP XML for Adobe Premiere Pro
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30"/>
  </resources>
  <library>
    <event name="${videoName} Segments">
      <project name="${videoName}">
        <sequence format="r1">
          <spine>
            ${segments.map((seg, i) => `
            <clip name="Segment ${i + 1}" duration="${seg.duration}s" start="${seg.startTime}s">
              <note>${seg.sceneScore ? `Score: ${seg.sceneScore.toFixed(3)}` : ''}</note>
            </clip>`).join('')}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
    
    const blob = new Blob([xml], { type: 'text/xml' });
    downloadFile(blob, `${videoName}_premiere.fcpxml`);
  };

  const secondsToTimecode = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 30); // Assuming 30fps
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export successful",
      description: `Segments exported as ${filename}`,
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    setTimeout(() => {
      switch (exportFormat) {
        case 'json':
          exportAsJSON();
          break;
        case 'csv':
          exportAsCSV();
          break;
        case 'edl':
          exportAsEDL();
          break;
        case 'premiere':
          exportAsPremierePro();
          break;
      }
      setIsExporting(false);
    }, 500);
  };

  const shareUrl = `${window.location.origin}/segments/${videoId}`;

  const handleShare = (platform: string) => {
    const text = `Check out the ${segments.length} scenes detected in "${videoName}"`;
    let url = '';
    
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }
    
    if (url) {
      window.open(url, '_blank', 'width=600,height=400');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: "Link copied",
      description: "Share link copied to clipboard",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Export & Share</span>
          <Badge variant="secondary">{segments.length} segments</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Options */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-full" data-testid="export-format-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">
                  <div className="flex items-center">
                    <FileJson className="h-4 w-4 mr-2" />
                    JSON Format
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    CSV Spreadsheet
                  </div>
                </SelectItem>
                <SelectItem value="edl">
                  <div className="flex items-center">
                    <FileVideo className="h-4 w-4 mr-2" />
                    EDL (Edit Decision List)
                  </div>
                </SelectItem>
                <SelectItem value="premiere">
                  <div className="flex items-center">
                    <FileVideo className="h-4 w-4 mr-2" />
                    Premiere Pro XML
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleExport}
              disabled={isExporting || segments.length === 0}
              data-testid="export-button"
            >
              {isExporting ? (
                <>Processing...</>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            {exportFormat === 'json' && "Machine-readable format with all segment metadata"}
            {exportFormat === 'csv' && "Import into Excel, Google Sheets, or other spreadsheet apps"}
            {exportFormat === 'edl' && "Compatible with most professional video editing software"}
            {exportFormat === 'premiere' && "Direct import into Adobe Premiere Pro timeline"}
          </p>
        </div>
        
        {/* Share Options */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Share Results</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare('twitter')}
              data-testid="share-twitter"
            >
              <Twitter className="h-4 w-4 mr-2" />
              Twitter
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare('facebook')}
              data-testid="share-facebook"
            >
              <Facebook className="h-4 w-4 mr-2" />
              Facebook
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleShare('linkedin')}
              data-testid="share-linkedin"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              LinkedIn
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              data-testid="copy-link"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}