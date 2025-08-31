import { cn } from "@/lib/utils";

export function ProcessingLoader({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-4 border-primary/40 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        <div className="absolute inset-4 border-4 border-primary/60 border-t-transparent rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
      </div>
    </div>
  );
}

export function VideoAnalyzer({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      <div className="relative w-32 h-24 bg-card rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary">
          <div className="h-full bg-white/30 animate-[scan_2s_ease-in-out_infinite]"></div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div 
            key={i} 
            className="absolute top-1/2 h-px bg-primary/40 w-full"
            style={{ 
              transform: `translateY(${(i - 2) * 6}px)`,
              animation: `pulse ${1.5 + i * 0.2}s ease-in-out infinite`
            }}
          />
        ))}
      </div>
      <div className="flex space-x-1">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="w-2 h-8 bg-primary/60 rounded-full"
            style={{ 
              animation: `bounce 1.4s ease-in-out ${i * 0.1}s infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function SceneDetectionAnimation({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-64 h-40", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg"></div>
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path
          d="M0,80 Q64,40 128,80 T256,80"
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="2"
          className="animate-[wave_3s_ease-in-out_infinite]"
        />
        <path
          d="M0,100 Q64,60 128,100 T256,100"
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="2"
          className="animate-[wave_3s_ease-in-out_infinite_0.5s]"
        />
      </svg>
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-full bg-destructive opacity-60"
          style={{
            left: `${16 + i * 36}px`,
            animation: `fadeInOut ${2 + i * 0.3}s ease-in-out infinite`
          }}
        />
      ))}
    </div>
  );
}

export function UploadPulse({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-16 h-16", className)}>
      <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
      <div className="absolute inset-0 bg-primary/40 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
      <div className="relative w-full h-full bg-primary rounded-full flex items-center justify-center">
        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
    </div>
  );
}