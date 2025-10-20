import React, { useState } from 'react';
import { useGamification } from '../context/GamificationContext';

const Leaderboard: React.FC = () => {
  const { leaderboard, loading, stats } = useGamification();
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `${rank}.`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-600 bg-yellow-50';
      case 2: return 'text-gray-600 bg-gray-50';
      case 3: return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-700 bg-white';
    }
  };

  const currentUserRank = stats?.rank || 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <span>🏆</span>
          Leaderboard
        </h3>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as 'all' | 'week' | 'month')}
          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Time</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Current User Position (if not in top 10) */}
      {currentUserRank > 10 && stats && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-700 mb-2">Your Position:</div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                {currentUserRank}
              </div>
              <div>
                <div className="font-medium text-gray-900">You</div>
                <div className="text-sm text-gray-600">Level {stats.level}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="font-semibold text-gray-900">{stats.points.toLocaleString()}</div>
              <div className="text-xs text-gray-500">XP</div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      <div className="space-y-2">
        {leaderboard.length > 0 ? (
          leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUser = stats && user._id === stats.rank; // Note: This needs to be adjusted based on actual user ID comparison
            
            return (
              <div
                key={user._id || index}
                className={`p-3 rounded-lg border transition-all ${
                  isCurrentUser 
                    ? 'border-primary-300 bg-primary-50 shadow-sm' 
                    : getRankColor(rank)
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                      rank <= 3 ? 'text-lg' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {getRankEmoji(rank)}
                    </div>
                    <div>
                      <div className={`font-medium ${isCurrentUser ? 'text-primary-900' : 'text-gray-900'}`}>
                        {isCurrentUser ? `${user.name} (You)` : user.name}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span>Level {user.level}</span>
                        {user.streakCount > 0 && (
                          <span className="flex items-center gap-1">
                            🔥 {user.streakCount}
                          </span>
                        )}
                        {user.badgeCount > 0 && (
                          <span className="flex items-center gap-1">
                            🏆 {user.badgeCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${isCurrentUser ? 'text-primary-900' : 'text-gray-900'}`}>
                      {user.points?.toLocaleString() || '0'}
                    </div>
                    <div className="text-xs text-gray-500">XP</div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">👤</div>
            <p className="text-gray-600">No leaderboard data available</p>
            <p className="text-sm text-gray-500 mt-1">
              Complete some learning activities to see rankings!
            </p>
          </div>
        )}
      </div>

      {/* Leaderboard Footer */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-center text-sm text-gray-500">
          {leaderboard.length > 0 && (
            <p>Showing top {leaderboard.length} learners</p>
          )}
          <p className="mt-1">Keep learning to climb the ranks! 🚀</p>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
