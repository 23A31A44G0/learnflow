import React from 'react';
import { useGamification } from '../context/GamificationContext';

const StreakCounter: React.FC = () => {
  const { stats, loading } = useGamification();

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStreakEmoji = (streak: number) => {
    if (streak === 0) return '💭';
    if (streak < 3) return '🔥';
    if (streak < 7) return '⚡';
    if (streak < 30) return '🌟';
    return '👑';
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return 'Start your streak!';
    if (streak === 1) return 'Great start!';
    if (streak < 3) return 'Building momentum!';
    if (streak < 7) return 'On fire!';
    if (streak < 30) return 'Incredible streak!';
    return 'Legendary dedication!';
  };

  const getStreakColor = (streak: number) => {
    if (streak === 0) return 'text-gray-600';
    if (streak < 3) return 'text-orange-600';
    if (streak < 7) return 'text-red-600';
    if (streak < 30) return 'text-purple-600';
    return 'text-yellow-600';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`text-3xl ${stats.streakCount > 0 ? 'animate-pulse' : ''}`}>
          {getStreakEmoji(stats.streakCount)}
        </div>
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold ${getStreakColor(stats.streakCount)}`}>
              {stats.streakCount}
            </span>
            <span className="text-sm text-gray-600">day{stats.streakCount !== 1 ? 's' : ''}</span>
          </div>
          <p className="text-sm text-gray-600">{getStreakMessage(stats.streakCount)}</p>
        </div>
      </div>
      
      {/* Streak progress indicators */}
      <div className="mt-3">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Streak milestones</span>
        </div>
        <div className="flex gap-1">
          {[1, 3, 7, 30].map((milestone, index) => (
            <div
              key={milestone}
              className={`flex-1 h-2 rounded-full ${
                stats.streakCount >= milestone
                  ? 'bg-gradient-to-r from-orange-400 to-red-500'
                  : 'bg-gray-200'
              }`}
            >
              {stats.streakCount >= milestone && (
                <div className="w-full h-full rounded-full bg-gradient-to-r from-orange-400 to-red-500 animate-pulse"></div>
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1</span>
          <span>3</span>
          <span>7</span>
          <span>30</span>
        </div>
      </div>
    </div>
  );
};

export default StreakCounter;
