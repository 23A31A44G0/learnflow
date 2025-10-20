import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface DueCard {
  _id: string;
  question: {
    _id: string;
    question: string;
    answer: string;
    type: string;
  };
  masteryLevel: string;
  nextReviewDate: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
}

interface LearningStats {
  masteryDistribution: Array<{
    _id: string;
    count: number;
    avgEasinessFactor: number;
    avgInterval: number;
  }>;
  dueToday: number;
  totalCards: number;
}

const SpacedRepetition: React.FC = () => {
  const [dueCards, setDueCards] = useState<DueCard[]>([]);
  const [currentCard, setCurrentCard] = useState<DueCard | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDueCards();
    fetchStats();
  }, []);

  const fetchDueCards = async () => {
    try {
      const response = await api.get('/spaced-repetition/due');
      if (response.data.success) {
        setDueCards(response.data.data.cards);
        if (response.data.data.cards.length > 0) {
          setCurrentCard(response.data.data.cards[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching due cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/spaced-repetition/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const submitReview = async (quality: number) => {
    if (!currentCard) return;

    try {
      const response = await api.post(`/spaced-repetition/review/${currentCard._id}`, {
        quality
      });

      if (response.data.success) {
        const nextIndex = currentIndex + 1;
        if (nextIndex < dueCards.length) {
          setCurrentIndex(nextIndex);
          setCurrentCard(dueCards[nextIndex]);
          setShowAnswer(false);
          setUserAnswer('');
        } else {
          fetchStats();
          setCurrentCard(null);
        }
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    }
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case 'new': return 'bg-gray-100 text-gray-800';
      case 'learning': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      case 'mastered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentCard) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 All Reviews Complete!
            </h1>
            <p className="text-gray-600 mb-6">
              You've finished all your reviews for today. Great job!
            </p>
            
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Due Today</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.dueToday}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Cards</h3>
                  <p className="text-3xl font-bold text-gray-600">{stats.totalCards}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Mastered</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {stats.masteryDistribution.find(m => m._id === 'mastered')?.count || 0}
                  </p>
                </div>
              </div>
            )}
            
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Spaced Repetition Review</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getMasteryColor(currentCard.masteryLevel)}`}>
                {currentCard.masteryLevel}
              </span>
              <span className="text-gray-600">
                {currentIndex + 1} of {dueCards.length}
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / dueCards.length) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {currentCard.question.question}
            </h2>
            
            {!showAnswer && (
              <div className="mb-6">
                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                />
                <button
                  onClick={() => setShowAnswer(true)}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Show Answer
                </button>
              </div>
            )}

            {showAnswer && (
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Your Answer:</h3>
                  <p className="text-gray-700">{userAnswer || "No answer provided"}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-green-900 mb-2">Correct Answer:</h3>
                  <p className="text-green-700">{currentCard.question.answer}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">How well did you know this?</h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                    {[
                      { quality: 0, label: 'Blackout', color: 'bg-red-600', desc: 'Complete blackout' },
                      { quality: 1, label: 'Hard', color: 'bg-red-500', desc: 'Incorrect, easy recall' },
                      { quality: 2, label: 'Hesitant', color: 'bg-orange-500', desc: 'Correct with help' },
                      { quality: 3, label: 'Recall', color: 'bg-yellow-500', desc: 'Correct with effort' },
                      { quality: 4, label: 'Easy', color: 'bg-green-500', desc: 'Correct easily' },
                      { quality: 5, label: 'Perfect', color: 'bg-green-600', desc: 'Perfect response' }
                    ].map(({ quality, label, color, desc }) => (
                      <button
                        key={quality}
                        onClick={() => submitReview(quality)}
                        className={`${color} text-white p-3 rounded-lg hover:opacity-90 transition-opacity`}
                        title={desc}
                      >
                        <div className="font-semibold">{quality}</div>
                        <div className="text-xs">{label}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2 text-center">
                    Rate your recall quality (0 = didn't know, 5 = knew perfectly)
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Card Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{currentCard.repetitions}</p>
              <p className="text-sm text-gray-600">Repetitions</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{currentCard.easinessFactor.toFixed(1)}</p>
              <p className="text-sm text-gray-600">Easiness</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{currentCard.interval}</p>
              <p className="text-sm text-gray-600">Interval (days)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {new Date(currentCard.nextReviewDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">Next Review</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpacedRepetition;