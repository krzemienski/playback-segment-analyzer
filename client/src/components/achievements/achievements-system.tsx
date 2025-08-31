import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Film,
  Upload,
  Clock,
  TrendingUp,
  Award,
  Medal,
  Crown,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  points: number;
  category: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface UserStats {
  totalVideos: number;
  totalSegments: number;
  totalProcessingTime: number;
  streak: number;
  level: number;
  experience: number;
  nextLevelExp: number;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-upload',
    name: 'First Steps',
    description: 'Upload your first video',
    icon: Upload,
    points: 10,
    category: 'Getting Started',
    unlocked: false,
    tier: 'bronze'
  },
  {
    id: 'speed-demon',
    name: 'Speed Demon',
    description: 'Process a video in under 2 minutes',
    icon: Zap,
    points: 25,
    category: 'Performance',
    unlocked: false,
    tier: 'silver'
  },
  {
    id: 'batch-master',
    name: 'Batch Master',
    description: 'Process 5 videos in a single batch',
    icon: Film,
    points: 50,
    category: 'Efficiency',
    unlocked: false,
    tier: 'gold'
  },
  {
    id: 'scene-expert',
    name: 'Scene Detection Expert',
    description: 'Detect over 100 scenes total',
    icon: Target,
    points: 30,
    category: 'Expertise',
    unlocked: false,
    progress: 0,
    maxProgress: 100,
    tier: 'silver'
  },
  {
    id: 'daily-warrior',
    name: 'Daily Warrior',
    description: 'Upload videos 7 days in a row',
    icon: Star,
    points: 40,
    category: 'Consistency',
    unlocked: false,
    progress: 0,
    maxProgress: 7,
    tier: 'gold'
  },
  {
    id: 'video-veteran',
    name: 'Video Veteran',
    description: 'Process 50 videos total',
    icon: Crown,
    points: 100,
    category: 'Milestone',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
    tier: 'platinum'
  }
];

export function AchievementsSystem({ userStats }: { userStats?: UserStats }) {
  const [achievements, setAchievements] = useState(ACHIEVEMENTS);
  const [showUnlockAnimation, setShowUnlockAnimation] = useState<string | null>(null);
  const { toast } = useToast();

  const stats = userStats || {
    totalVideos: 12,
    totalSegments: 89,
    totalProcessingTime: 1824,
    streak: 3,
    level: 5,
    experience: 450,
    nextLevelExp: 600
  };

  useEffect(() => {
    // Check for new achievements based on stats
    const updatedAchievements = achievements.map(achievement => {
      let shouldUnlock = false;
      let progress = achievement.progress;

      switch (achievement.id) {
        case 'first-upload':
          shouldUnlock = stats.totalVideos >= 1;
          break;
        case 'scene-expert':
          progress = Math.min(stats.totalSegments, 100);
          shouldUnlock = stats.totalSegments >= 100;
          break;
        case 'daily-warrior':
          progress = stats.streak;
          shouldUnlock = stats.streak >= 7;
          break;
        case 'video-veteran':
          progress = stats.totalVideos;
          shouldUnlock = stats.totalVideos >= 50;
          break;
      }

      if (shouldUnlock && !achievement.unlocked) {
        // Show unlock animation
        setShowUnlockAnimation(achievement.id);
        setTimeout(() => setShowUnlockAnimation(null), 3000);
        
        // Show toast notification
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${achievement.name} - ${achievement.points} points earned!`,
        });

        return { ...achievement, unlocked: true, unlockedAt: new Date().toISOString(), progress };
      }

      return { ...achievement, progress };
    });

    setAchievements(updatedAchievements);
  }, [stats]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      case 'silver': return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
      case 'gold': return 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/20';
      case 'platinum': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const totalPoints = achievements
    .filter(a => a.unlocked)
    .reduce((sum, a) => sum + a.points, 0);

  const completionRate = Math.round(
    (achievements.filter(a => a.unlocked).length / achievements.length) * 100
  );

  return (
    <div className="space-y-6" data-testid="achievements-system">
      {/* User Level & Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Progress</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              Level {stats.level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-mono">{stats.experience} / {stats.nextLevelExp} XP</span>
              </div>
              <Progress value={(stats.experience / stats.nextLevelExp) * 100} />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
                <p className="text-xs text-muted-foreground">Videos Processed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalSegments}</p>
                <p className="text-xs text-muted-foreground">Scenes Detected</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.streak}🔥</p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{totalPoints}</p>
                <p className="text-xs text-muted-foreground">Total Points</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
              Achievements
            </span>
            <Badge variant="secondary">{completionRate}% Complete</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map(achievement => {
              const Icon = achievement.icon;
              const isAnimating = showUnlockAnimation === achievement.id;
              
              return (
                <div
                  key={achievement.id}
                  className={cn(
                    "relative p-4 rounded-lg border transition-all",
                    achievement.unlocked 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-secondary/20 border-secondary/40 opacity-75",
                    isAnimating && "achievement-pop"
                  )}
                  data-testid={`achievement-${achievement.id}`}
                >
                  {isAnimating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 rounded-lg animate-pulse"></div>
                  )}
                  
                  <div className="flex items-start space-x-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      getTierColor(achievement.tier)
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{achievement.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {achievement.points} pts
                        </Badge>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {achievement.description}
                      </p>
                      
                      {achievement.maxProgress && (
                        <div className="mt-2">
                          <Progress 
                            value={(achievement.progress || 0) / achievement.maxProgress * 100} 
                            className="h-1"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            {achievement.progress} / {achievement.maxProgress}
                          </p>
                        </div>
                      )}
                      
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                          ✓ Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Medal className="h-5 w-5 mr-2 text-yellow-500" />
            Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { rank: 1, name: "You", points: totalPoints, trend: "up" },
              { rank: 2, name: "Alex Chen", points: 280, trend: "same" },
              { rank: 3, name: "Sarah Miller", points: 265, trend: "down" },
              { rank: 4, name: "Mike Johnson", points: 240, trend: "up" },
              { rank: 5, name: "Emma Davis", points: 220, trend: "up" },
            ].map(entry => (
              <div 
                key={entry.rank}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg",
                  entry.name === "You" && "bg-primary/10 border border-primary/20"
                )}
              >
                <div className="flex items-center space-x-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                    entry.rank === 1 && "bg-yellow-500 text-white",
                    entry.rank === 2 && "bg-gray-400 text-white",
                    entry.rank === 3 && "bg-orange-600 text-white",
                    entry.rank > 3 && "bg-secondary text-secondary-foreground"
                  )}>
                    {entry.rank}
                  </div>
                  <span className="font-medium">{entry.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-sm">{entry.points} pts</span>
                  {entry.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}