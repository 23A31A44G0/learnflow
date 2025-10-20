import React, { useState, useEffect } from 'react';
import api from '../services/api';

interface Reflection {
  _id: string;
  promptType: string;
  prompt: string;
  userResponse: string;
  context: any;
  aiAnalysis: {
    metacognitiveScore: number;
    insights: string;
    learningPatterns: string[];
    suggestions: string[];
  };
  createdAt: string;
}

interface Analytics {
  averageScore: number;
  totalReflections: number;
  recentTrends: {
    weeklyScores: number[];
    improvementRate: number;
  };
  commonPatterns: Array<{
    pattern: string;
    frequency: number;
  }>;
  strongAreas: string[];
  growthAreas: string[];
}

const MetacognitiveDashboard: React.FC = () => {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');

  useEffect(() => {
    fetchData();
  }, [timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reflectionsRes, analyticsRes] = await Promise.all([
        api.get(`/metacognitive/reflections?timeRange=${timeRange}`),
        api.get(`/metacognitive/analytics?timeRange=${timeRange}`)
      ]);

      setReflections(reflectionsRes.data.reflections);
      setAnalytics(analyticsRes.data.analytics);
    } catch (error) {
      console.error('Error fetching metacognitive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getPromptTypeLabel = (type: string) => {
    const labels = {
      comprehension: 'Understanding Check',
      strategy: 'Strategy Reflection',
      confidence: 'Confidence Assessment',
      difficulty: 'Challenge Analysis',
      connection: 'Concept Connection'
    };
    return labels[type as keyof typeof labels] || type;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-300 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Self-Awareness</h1>
          <p className="text-gray-600 mt-2">
            Track your metacognitive development and learning patterns
          </p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg capitalize ${
                timeRange === range
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range === 'all' ? 'All Time' : `This ${range}`}
            </button>
          ))}
        </div>
      </div>

      {analytics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Average Reflection Score</h3>
                <div className="text-2xl">🎯</div>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {analytics.averageScore.toFixed(1)}/10
              </div>
              <div className="text-sm text-gray-600">
                {analytics.recentTrends.improvementRate > 0 ? '📈' : '📉'} 
                {Math.abs(analytics.recentTrends.improvementRate).toFixed(1)}% this period
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Total Reflections</h3>
                <div className="text-2xl">📝</div>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {analytics.totalReflections}
              </div>
              <div className="text-sm text-gray-600">
                Reflections completed
              </div>
            </div>

            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">Learning Consistency</h3>
                <div className="text-2xl">⚡</div>
              </div>
              <div className="text-3xl font-bold text-primary-600 mb-1">
                {Math.round((analytics.totalReflections / Math.max(analytics.recentTrends.weeklyScores.length, 1)) * 10) / 10}
              </div>
              <div className="text-sm text-gray-600">
                Reflections per week
              </div>
            </div>
          </div>

          {/* Learning Patterns & Growth Areas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Strong Areas */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-green-600 mr-2">💪</span>
                Your Strengths
              </h3>
              {analytics.strongAreas.length > 0 ? (
                <div className="space-y-2">
                  {analytics.strongAreas.map((area, index) => (
                    <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-600 mr-2">✓</span>
                      <span className="text-gray-800">{area}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Complete more reflections to identify your strengths</p>
              )}
            </div>

            {/* Growth Areas */}
            <div className="bg-white rounded-lg border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-orange-600 mr-2">🎯</span>
                Growth Opportunities
              </h3>
              {analytics.growthAreas.length > 0 ? (
                <div className="space-y-2">
                  {analytics.growthAreas.map((area, index) => (
                    <div key={index} className="flex items-center p-3 bg-orange-50 rounded-lg">
                      <span className="text-orange-600 mr-2">→</span>
                      <span className="text-gray-800">{area}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Keep reflecting to discover growth opportunities</p>
              )}
            </div>
          </div>

          {/* Common Learning Patterns */}
          {analytics.commonPatterns.length > 0 && (
            <div className="bg-white rounded-lg border p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-blue-600 mr-2">🔍</span>
                Your Learning Patterns
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analytics.commonPatterns.map((pattern, index) => (
                  <div key={index} className="p-4 bg-blue-50 rounded-lg">
                    <div className="font-medium text-gray-800 mb-1">{pattern.pattern}</div>
                    <div className="text-sm text-gray-600">
                      Appeared {pattern.frequency} time{pattern.frequency !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Recent Reflections */}
      <div className="bg-white rounded-lg border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Recent Reflections</h3>
          <p className="text-gray-600 text-sm mt-1">Review your past reflections and insights</p>
        </div>
        
        <div className="p-6">
          {reflections.length > 0 ? (
            <div className="space-y-4">
              {reflections.map((reflection) => (
                <div
                  key={reflection._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReflection(reflection)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600">
                        {getPromptTypeLabel(reflection.promptType)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(reflection.aiAnalysis.metacognitiveScore)}`}>
                        {reflection.aiAnalysis.metacognitiveScore}/10
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(reflection.createdAt)}</span>
                  </div>
                  <p className="text-gray-700 mb-2 line-clamp-2">{reflection.prompt}</p>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    <strong>Your reflection:</strong> {reflection.userResponse}
                  </p>
                  {reflection.aiAnalysis.learningPatterns.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {reflection.aiAnalysis.learningPatterns.slice(0, 3).map((pattern, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                        >
                          {pattern}
                        </span>
                      ))}
                      {reflection.aiAnalysis.learningPatterns.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                          +{reflection.aiAnalysis.learningPatterns.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🤔</div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No reflections yet</h3>
              <p className="text-gray-500">
                Complete some practice sessions or learning activities to start building your metacognitive awareness
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Reflection Modal */}
      {selectedReflection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {getPromptTypeLabel(selectedReflection.promptType)}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatDate(selectedReflection.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReflection(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Original Prompt */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Reflection Question</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
                    <p className="text-gray-800">{selectedReflection.prompt}</p>
                  </div>
                </div>

                {/* Your Response */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Your Response</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-gray-800">{selectedReflection.userResponse}</p>
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">AI Analysis & Insights</h3>
                  
                  <div className="bg-white border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Reflection Quality Score</h4>
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-primary-600">
                          {selectedReflection.aiAnalysis.metacognitiveScore}
                        </span>
                        <span className="text-gray-500 ml-1">/10</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(selectedReflection.aiAnalysis.metacognitiveScore / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Key Insights</h4>
                    <p className="text-gray-700 leading-relaxed">{selectedReflection.aiAnalysis.insights}</p>
                  </div>

                  {selectedReflection.aiAnalysis.learningPatterns.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Learning Patterns</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedReflection.aiAnalysis.learningPatterns.map((pattern, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {pattern}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedReflection.aiAnalysis.suggestions.length > 0 && (
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">Suggestions</h4>
                      <ul className="space-y-2">
                        {selectedReflection.aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary-600 mr-2">•</span>
                            <span className="text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetacognitiveDashboard;
