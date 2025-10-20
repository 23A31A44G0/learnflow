import React from 'react';
import { useGamification } from '../context/GamificationContext';

const UserLevelDisplay: React.FC = () => {
  const { stats, loading } = useGamification();

  if (loading || !stats) {
    return (
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-white bg-opacity-20 rounded w-20 mb-2"></div>
            <div className="h-3 bg-white bg-opacity-20 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate level progress
  const getLevelThresholds = () => {
    // These should match the backend LEVEL_THRESHOLDS
    return [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000, 25000, 35000, 50000, 75000, 100000];
  };

  const thresholds = getLevelThresholds();
  const currentLevelThreshold = thresholds[stats.level - 1] || 0;
  const nextLevelThreshold = thresholds[stats.level] || thresholds[thresholds.length - 1];
  const pointsInCurrentLevel = stats.points - currentLevelThreshold;
  const pointsNeededForNextLevel = nextLevelThreshold - currentLevelThreshold;
  const progressPercentage = Math.min((pointsInCurrentLevel / pointsNeededForNextLevel) * 100, 100);

  const getLevelIcon = (level: number) => {
    if (level >= 15) return '👑';
    if (level >= 12) return '🌟';
    if (level >= 9) return '💎';
    if (level >= 6) return '🔥';
    if (level >= 3) return '⚡';
    return '🌱';
  };

  const getLevelTitle = (level: number) => {
    if (level >= 15) return 'Learning Master';
    if (level >= 12) return 'Knowledge Expert';
    if (level >= 9) return 'Study Champion';
    if (level >= 6) return 'Learning Enthusiast';
    if (level >= 3) return 'Rising Scholar';
    return 'Learning Beginner';
  };

  const isMaxLevel = stats.level >= thresholds.length;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl">
          {getLevelIcon(stats.level)}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">Level {stats.level}</span>
            {stats.rank && (
              <span className="text-sm text-white text-opacity-80">#{stats.rank}</span>
            )}
          </div>
          <p className="text-sm text-white text-opacity-90">{getLevelTitle(stats.level)}</p>
        </div>
      </div>

      <div className="space-y-2">
        {/* XP Display */}
        <div className="flex justify-between text-sm text-white text-opacity-90">
          <span>Experience Points</span>
          <span className="font-medium">{stats.points.toLocaleString()} XP</span>
        </div>

        {/* Level Progress Bar */}
        {!isMaxLevel && (
          <>
            <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-300 shadow-sm"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-white text-opacity-75">
              <span>{pointsInCurrentLevel.toLocaleString()}</span>
              <span>{pointsNeededForNextLevel.toLocaleString()} XP</span>
            </div>
            <div className="text-center text-xs text-white text-opacity-80">
              {(pointsNeededForNextLevel - pointsInCurrentLevel).toLocaleString()} XP to next level
            </div>
          </>
        )}

        {isMaxLevel && (
          <div className="text-center py-2">
            <div className="text-yellow-200 font-medium">🏆 Max Level Achieved!</div>
            <div className="text-xs text-white text-opacity-80 mt-1">
              You've reached the pinnacle of learning!
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white border-opacity-20">
        <div className="text-center">
          <div className="text-lg font-bold">{stats.streakCount}</div>
          <div className="text-xs text-white text-opacity-80">Day Streak</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold">{stats.badges.length}</div>
          <div className="text-xs text-white text-opacity-80">Badges</div>
        </div>
      </div>
    </div>
  );
};

export default UserLevelDisplay;
