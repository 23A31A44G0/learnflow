import React from 'react';
import { useGamification } from '../context/GamificationContext';

const DailyGoals: React.FC = () => {
  const { stats, loading } = useGamification();

  if (loading || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-24 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { todayProgress, dailyGoals, dailyGoalsMet } = stats;

  const goals = [
    {
      id: 'questions',
      name: 'Questions',
      icon: '📝',
      current: todayProgress.questionsAnswered,
      target: dailyGoals.questionsTarget,
      met: dailyGoalsMet.questions,
      color: 'blue'
    },
    {
      id: 'studyTime',
      name: 'Study Time',
      icon: '⏱️',
      current: todayProgress.studyTimeMinutes,
      target: dailyGoals.studyTimeTarget,
      met: dailyGoalsMet.studyTime,
      color: 'green',
      unit: 'min'
    },
    {
      id: 'reflections',
      name: 'Reflections',
      icon: '🤔',
      current: todayProgress.reflectionsCompleted,
      target: dailyGoals.reflectionsTarget,
      met: dailyGoalsMet.reflections,
      color: 'purple'
    }
  ];

  const getProgressBarColor = (color: string, met: boolean) => {
    if (met) {
      return {
        blue: 'bg-gradient-to-r from-blue-400 to-blue-600',
        green: 'bg-gradient-to-r from-green-400 to-green-600',
        purple: 'bg-gradient-to-r from-purple-400 to-purple-600'
      }[color];
    }
    return {
      blue: 'bg-blue-300',
      green: 'bg-green-300',
      purple: 'bg-purple-300'
    }[color];
  };

  const allGoalsMet = dailyGoalsMet.allMet;
  const completedGoals = goals.filter(goal => goal.met).length;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>🎯</span>
          Daily Goals
        </h3>
        {allGoalsMet && (
          <div className="flex items-center gap-1 text-sm text-green-600 font-medium">
            <span>🎉</span>
            Complete!
          </div>
        )}
      </div>

      {/* Overall Progress */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Overall Progress</span>
          <span>{completedGoals}/{goals.length} goals</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              allGoalsMet 
                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }`}
            style={{ width: `${(completedGoals / goals.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Individual Goals */}
      <div className="space-y-3">
        {goals.map((goal) => {
          const progressPercentage = Math.min((goal.current / goal.target) * 100, 100);
          
          return (
            <div key={goal.id} className="relative">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{goal.icon}</span>
                  <span className="text-sm font-medium text-gray-700">{goal.name}</span>
                  {goal.met && (
                    <span className="text-green-500 text-sm">✓</span>
                  )}
                </div>
                <span className="text-sm text-gray-600">
                  {goal.current}/{goal.target}{goal.unit ? ` ${goal.unit}` : ''}
                </span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getProgressBarColor(goal.color, goal.met)
                  } ${goal.met ? 'animate-pulse' : ''}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Encouragement Message */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="text-center text-sm">
          {allGoalsMet ? (
            <p className="text-green-600 font-medium">
              🎉 Amazing work! All daily goals completed!
            </p>
          ) : completedGoals > 0 ? (
            <p className="text-blue-600">
              Great progress! Keep going to complete all goals 💪
            </p>
          ) : (
            <p className="text-gray-600">
              Start your learning journey today! 🚀
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyGoals;
