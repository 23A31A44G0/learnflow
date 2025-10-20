import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { metacognitiveAPI } from '../services/api';

interface MetacognitiveSummary {
  totalReflections: number;
  averageScore: number;
  recentImprovement: number;
  streakDays: number;
}

const MetacognitiveSummaryCard: React.FC = () => {
  const [summary, setSummary] = useState<MetacognitiveSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await metacognitiveAPI.getAnalytics('week');
      setSummary({
        totalReflections: response.analytics.totalReflections,
        averageScore: response.analytics.averageScore,
        recentImprovement: response.analytics.recentTrends.improvementRate,
        streakDays: Math.floor(response.analytics.totalReflections / 2) // Simplified calculation
      });
    } catch (error) {
      console.error('Error fetching metacognitive summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white animate-pulse">
        <div className="h-6 bg-white bg-opacity-20 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-white bg-opacity-20 rounded w-1/2 mb-6"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-white bg-opacity-20 rounded"></div>
          <div className="h-8 bg-white bg-opacity-20 rounded"></div>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">🧠</div>
          <div>
            <h3 className="text-lg font-semibold">Learning Self-Awareness</h3>
            <p className="text-sm text-white text-opacity-90">Track your metacognitive development</p>
          </div>
        </div>
        <p className="text-white text-opacity-80 mb-4">
          Complete some practice sessions or learn new concepts to start building your self-awareness!
        </p>
        <Link
          to="/metacognitive"
          className="inline-flex items-center text-sm font-medium text-white hover:text-opacity-80 transition-colors"
        >
          Get started →
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="text-2xl mr-3">🧠</div>
          <div>
            <h3 className="text-lg font-semibold">Learning Self-Awareness</h3>
            <p className="text-sm text-white text-opacity-90">Your metacognitive development</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{summary.averageScore.toFixed(1)}</div>
          <div className="text-xs text-white text-opacity-80">Avg. Score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white bg-opacity-10 rounded-lg p-3">
          <div className="text-lg font-semibold">{summary.totalReflections}</div>
          <div className="text-xs text-white text-opacity-80">Reflections</div>
        </div>
        <div className="bg-white bg-opacity-10 rounded-lg p-3">
          <div className="flex items-center">
            <span className="text-lg font-semibold">
              {summary.recentImprovement > 0 ? '+' : ''}{summary.recentImprovement.toFixed(1)}%
            </span>
            <span className="ml-1 text-xs">
              {summary.recentImprovement > 0 ? '📈' : summary.recentImprovement < 0 ? '📉' : '➡️'}
            </span>
          </div>
          <div className="text-xs text-white text-opacity-80">This week</div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-white text-opacity-90">
          {summary.totalReflections > 0 && (
            <span>🔥 Keep reflecting to build awareness!</span>
          )}
        </div>
        <Link
          to="/metacognitive"
          className="inline-flex items-center text-sm font-medium text-white hover:text-opacity-80 transition-colors"
        >
          View insights →
        </Link>
      </div>
    </div>
  );
};

export default MetacognitiveSummaryCard;
