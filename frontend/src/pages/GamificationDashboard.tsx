import React from 'react';
import { Link } from 'react-router-dom';
import { useGamification } from '../context/GamificationContext';
import UserLevelDisplay from '../components/UserLevelDisplay';
import DailyGoals from '../components/DailyGoals';
import StreakCounter from '../components/StreakCounter';
import BadgeDisplay from '../components/BadgeDisplay';
import Leaderboard from '../components/Leaderboard';

const GamificationDashboard: React.FC = () => {
  const { stats, loading } = useGamification();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-48 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Progress</h1>
          <p className="text-gray-600 mt-2">
            Track your achievements, compete with others, and level up your learning!
          </p>
        </div>
        <Link
          to="/dashboard"
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Level Display */}
        <UserLevelDisplay />
        
        {/* Daily Goals */}
        <DailyGoals />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {/* Streak Counter */}
        <StreakCounter />
        
        {/* Badge Display */}
        <div className="md:col-span-2 xl:col-span-1">
          <BadgeDisplay />
        </div>
        
        {/* Achievement Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 md:col-span-2 xl:col-span-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Achievement Summary
          </h3>
          
          {stats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats.points.toLocaleString()}</div>
                  <div className="text-sm text-blue-700">Total XP</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{stats.level}</div>
                  <div className="text-sm text-purple-700">Current Level</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{stats.streakCount}</div>
                  <div className="text-sm text-green-700">Day Streak</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{stats.badges.length}</div>
                  <div className="text-sm text-yellow-700">Badges Earned</div>
                </div>
              </div>

              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <div className="text-2xl font-bold text-indigo-600">#{stats.rank}</div>
                <div className="text-sm text-indigo-700">Global Rank</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Leaderboard */}
        <div className="xl:col-span-2">
          <Leaderboard />
        </div>
        
        {/* Learning Tips & Motivation */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-6 border border-green-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>💡</span>
            Learning Tips
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-2">🔥 Maintain Your Streak</h4>
              <p className="text-sm text-gray-600">
                Consistent daily practice is key to long-term retention. Even 10 minutes counts!
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-2">🧠 Reflect Often</h4>
              <p className="text-sm text-gray-600">
                Use the Self-Awareness feature to reflect on your learning and earn bonus XP.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-2">🎯 Set Daily Goals</h4>
              <p className="text-sm text-gray-600">
                Complete your daily goals to earn significant bonus points and build good habits.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h4 className="font-medium text-gray-800 mb-2">🏆 Collect Badges</h4>
              <p className="text-sm text-gray-600">
                Unlock achievements by trying different features and reaching milestones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationDashboard;
