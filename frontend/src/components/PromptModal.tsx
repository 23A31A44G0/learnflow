import React, { useState } from 'react';
import api from '../services/api';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reflection: any) => void;
  prompt: string;
  promptType: string;
  context: {
    sessionType?: string;
    performanceScore?: number;
    conceptsStudied?: string[];
    timeSpent?: number;
    difficultyLevel?: string;
  };
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  promptType,
  context
}) => {
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleSubmit = async () => {
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      const result = await api.post('/metacognitive/reflect', {
        promptType,
        prompt,
        userResponse: response,
        context
      });

      setAnalysis(result.data.reflection.aiAnalysis);
      onSubmit(result.data.reflection);
    } catch (error) {
      console.error('Error submitting reflection:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setResponse('');
    setAnalysis(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Learning Reflection</h2>
              <p className="text-sm text-gray-600 mt-1">
                Take a moment to reflect on your learning experience
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Context Info */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Session Summary</h3>
            <div className="text-sm text-gray-600 space-y-1">
              {context.sessionType && (
                <div>Type: <span className="font-medium">{context.sessionType}</span></div>
              )}
              {context.performanceScore !== undefined && (
                <div>Performance: <span className="font-medium">{context.performanceScore}%</span></div>
              )}
              {context.conceptsStudied && context.conceptsStudied.length > 0 && (
                <div>Concepts: <span className="font-medium">{context.conceptsStudied.join(', ')}</span></div>
              )}
              {context.timeSpent && (
                <div>Time Spent: <span className="font-medium">{Math.round(context.timeSpent / 60)} minutes</span></div>
              )}
            </div>
          </div>

          {/* Reflection Prompt */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Reflection Question</h3>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-primary-500">
              <p className="text-gray-800">{prompt}</p>
            </div>
          </div>

          {/* Response Area */}
          {!analysis && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Reflection
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Take your time to think and write thoughtfully about your learning experience..."
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {response.length} characters • Be honest and specific for better insights
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                    disabled={submitting}
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!response.trim() || submitting}
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Analyzing...' : 'Submit Reflection'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* AI Analysis Results */}
          {analysis && (
            <div className="space-y-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✓ Reflection Submitted</h3>
                <p className="text-green-700 text-sm">Your reflection has been analyzed. Here are your personalized insights:</p>
              </div>

              {/* Metacognitive Score */}
              <div className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">Reflection Quality Score</h4>
                  <div className="flex items-center">
                    <span className="text-2xl font-bold text-primary-600">{analysis.metacognitiveScore}</span>
                    <span className="text-gray-500 ml-1">/10</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(analysis.metacognitiveScore / 10) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Key Insights</h4>
                <p className="text-gray-700 leading-relaxed">{analysis.insights}</p>
              </div>

              {/* Learning Patterns */}
              {analysis.learningPatterns && analysis.learningPatterns.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Learning Patterns Identified</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.learningPatterns.map((pattern: string, index: number) => (
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

              {/* Suggestions */}
              {analysis.suggestions && analysis.suggestions.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Personalized Suggestions</h4>
                  <ul className="space-y-2">
                    {analysis.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-primary-600 mr-2">•</span>
                        <span className="text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Continue Learning
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
