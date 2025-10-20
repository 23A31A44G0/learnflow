import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { 
  triggerConfetti, 
  triggerBadgeAnimation, 
  triggerPointsAnimation, 
  triggerLevelUpAnimation 
} from '../utils/gamificationAnimations';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  unlockedAt?: string;
  unlocked?: boolean;
}

interface GamificationStats {
  points: number;
  level: number;
  streakCount: number;
  badges: Badge[];
  rank: number;
  todayProgress: {
    date: string;
    questionsAnswered: number;
    studyTimeMinutes: number;
    reflectionsCompleted: number;
  };
  dailyGoals: {
    questionsTarget: number;
    studyTimeTarget: number;
    reflectionsTarget: number;
  };
  dailyGoalsMet: {
    questions: boolean;
    studyTime: boolean;
    reflections: boolean;
    allMet: boolean;
  };
}

interface GamificationResult {
  pointsAwarded?: Array<{
    pointsAwarded: number;
    totalPoints: number;
    newLevel: number;
    leveledUp: boolean;
    pointType: string;
  }>;
  newBadges?: Badge[];
  streakUpdate?: {
    streakCount: number;
    streakUpdated: boolean;
    streakBonus?: any;
  };
  levelUp?: boolean;
}

interface GamificationContextType {
  stats: GamificationStats | null;
  loading: boolean;
  badges: Badge[];
  leaderboard: any[];
  refreshStats: () => Promise<void>;
  processGamificationResult: (result: GamificationResult) => void;
  showCelebration: boolean;
  setShowCelebration: (show: boolean) => void;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showCelebration, setShowCelebration] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, badgesRes, leaderboardRes] = await Promise.all([
        api.get('/gamification/stats'),
        api.get('/gamification/badges'),
        api.get('/gamification/leaderboard?limit=10')
      ]);

      setStats(statsRes.data.stats);
      setBadges(badgesRes.data.badges);
      setLeaderboard(leaderboardRes.data.leaderboard);
    } catch (error) {
      console.error('Error fetching gamification data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const processGamificationResult = useCallback((result: GamificationResult) => {
    if (!result) return;

    // Process points and level ups
    if (result.pointsAwarded && result.pointsAwarded.length > 0) {
      result.pointsAwarded.forEach((pointResult, index) => {
        setTimeout(() => {
          triggerPointsAnimation(pointResult.pointsAwarded);
          
          if (pointResult.leveledUp) {
            setTimeout(() => {
              triggerLevelUpAnimation(pointResult.newLevel);
            }, 500);
          }
        }, index * 500);
      });
    }

    // Process new badges
    if (result.newBadges && result.newBadges.length > 0) {
      result.newBadges.forEach((badge, index) => {
        setTimeout(() => {
          triggerBadgeAnimation(badge.name, badge.icon);
        }, (index + 1) * 1000);
      });
    }

    // Show confetti for major achievements
    const totalPoints = result.pointsAwarded?.reduce((sum, p) => sum + p.pointsAwarded, 0) || 0;
    const hasNewBadges = result.newBadges && result.newBadges.length > 0;
    const hasLevelUp = result.pointsAwarded?.some(p => p.leveledUp) || false;
    
    if (totalPoints > 100 || hasNewBadges || hasLevelUp) {
      setTimeout(() => {
        triggerConfetti();
      }, 1500);
    }

    // Refresh stats after processing
    setTimeout(() => {
      refreshStats();
    }, 2000);
  }, [refreshStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const value: GamificationContextType = {
    stats,
    loading,
    badges,
    leaderboard,
    refreshStats,
    processGamificationResult,
    showCelebration,
    setShowCelebration
  };

  return (
    <GamificationContext.Provider value={value}>
      {children}
    </GamificationContext.Provider>
  );
};
