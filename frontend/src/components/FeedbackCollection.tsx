import React, { useState, useEffect } from 'react';
import { analytics } from '../services/analytics';

interface FeedbackData {
  userId: string;
  sessionId: string;
  feedback: {
    firstImpression: string;
    difficulty: string;
    missingFeatures: string;
    overallRating: number;
    wouldRecommend: boolean;
    additionalComments: string;
  };
  usage: {
    questionsGenerated: number;
    practiceSessionsCompleted: number;
    averageAccuracy: number;
    featuresUsed: string[];
  };
  timestamp: Date;
}

const FeedbackModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: any) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const [feedback, setFeedback] = useState({
    firstImpression: '',
    difficulty: '',
    missingFeatures: '',
    overallRating: 5,
    wouldRecommend: true,
    additionalComments: '',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(feedback);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Help Us Improve LearnFlow 🚀
          </h2>
          <p className="text-gray-600 mb-6">
            Your feedback is invaluable! Please take a few minutes to share your experience.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* First Impression */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What was your first impression when you started using LearnFlow?
              </label>
              <textarea
                value={feedback.firstImpression}
                onChange={(e) => setFeedback({...feedback, firstImpression: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Be honest! Your first impression helps us understand user experience..."
                required
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What was the most difficult part of using the platform?
              </label>
              <textarea
                value={feedback.difficulty}
                onChange={(e) => setFeedback({...feedback, difficulty: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Any confusing features, unclear instructions, or technical issues..."
                required
              />
            </div>

            {/* Missing Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What features would you like LearnFlow to have that it doesn't currently offer?
              </label>
              <textarea
                value={feedback.missingFeatures}
                onChange={(e) => setFeedback({...feedback, missingFeatures: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Think about what would make your studying more effective..."
                required
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Overall, how would you rate LearnFlow? (1-10)
              </label>
              <div className="flex space-x-2">
                {[1,2,3,4,5,6,7,8,9,10].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFeedback({...feedback, overallRating: num})}
                    className={`w-10 h-10 rounded-full font-bold transition-colors ${
                      feedback.overallRating === num
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Recommendation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Would you recommend LearnFlow to other students?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setFeedback({...feedback, wouldRecommend: true})}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    feedback.wouldRecommend
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Yes 👍
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback({...feedback, wouldRecommend: false})}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    !feedback.wouldRecommend
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No 👎
                </button>
              </div>
            </div>

            {/* Additional Comments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anything else you'd like to share?
              </label>
              <textarea
                value={feedback.additionalComments}
                onChange={(e) => setFeedback({...feedback, additionalComments: e.target.value})}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Suggestions, bugs, compliments, criticism - we want to hear it all!"
              />
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium"
              >
                Submit Feedback
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-400 font-medium"
              >
                Maybe Later
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export const useFeedbackCollection = () => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  useEffect(() => {
    // Show feedback modal after user has been active for 10 minutes
    const timer = setTimeout(() => {
      setShowFeedbackModal(true);
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearTimeout(timer);
  }, []);

  const submitFeedback = async (feedback: any) => {
    try {
      // Track feedback submission
      analytics.trackEvent({
        action: 'feedback_submitted',
        category: 'user_feedback',
        label: 'alpha_test',
        value: feedback.overallRating,
      });

      // Send to backend for storage
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          feedback,
          usage: {
            // Include usage metrics
            timestamp: new Date(),
          },
        }),
      });

      if (response.ok) {
        console.log('Feedback submitted successfully');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  return {
    showFeedbackModal,
    setShowFeedbackModal,
    submitFeedback,
    FeedbackModal,
  };
};
