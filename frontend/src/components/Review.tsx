import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Flashcard from './Flashcard';

interface Question {
  _id: string;
  question: string;
  answer: string;
  type: string;
  difficulty?: string;
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: string;
  totalReviews: number;
  correctReviews: number;
}

const Review: React.FC = () => {
  const [currentCard, setCurrentCard] = useState<Question | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dueCardsCount, setDueCardsCount] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);

  useEffect(() => {
    fetchNextCard();
  }, []);

  const fetchNextCard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/get-next-card');
      
      if (response.data.success) {
        if (response.data.data.card) {
          setCurrentCard(response.data.data.card);
          setDueCardsCount(response.data.data.dueCardsCount || 0);
          setShowAnswer(false);
          setReviewComplete(false);
        } else {
          setCurrentCard(null);
          setReviewComplete(true);
        }
      }
    } catch (error) {
      console.error('Error fetching next card:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (quality: number) => {
    if (!currentCard || submitting) return;

    try {
      setSubmitting(true);
      const response = await api.post('/api/v1/submit-review', {
        questionId: currentCard._id,
        quality
      });

      if (response.data.success) {
        // Show feedback briefly
        setTimeout(() => {
          fetchNextCard();
        }, 1000);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const QualityButton: React.FC<{ quality: number; label: string; color: string; description: string }> = ({
    quality,
    label,
    color,
    description
  }) => (
    <button
      onClick={() => submitReview(quality)}
      disabled={submitting}
      className={`
        ${color} text-white p-3 rounded-lg
        hover:opacity-90 disabled:opacity-50
        transition-all duration-200 transform hover:scale-105
        min-w-[80px] flex flex-col items-center
      `}
      title={description}
    >
      <div className="font-bold text-lg">{quality}</div>
      <div className="text-xs font-medium">{label}</div>
    </button>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your next review...</p>
        </div>
      </div>
    );
  }

  if (reviewComplete || !currentCard) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          All Reviews Complete!
        </h2>
        <p className="text-gray-600 mb-6">
          You've finished all your scheduled reviews. Great job on staying consistent!
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Check for New Reviews
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Review Session</h1>
        <p className="text-gray-600">
          Cards due today: <span className="font-semibold text-blue-600">{dueCardsCount}</span>
        </p>
        
        {/* Card Statistics */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{currentCard.repetitions}</div>
            <div className="text-xs text-gray-600">Reviews</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-green-600">{currentCard.easinessFactor.toFixed(1)}</div>
            <div className="text-xs text-gray-600">Ease</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{currentCard.interval}d</div>
            <div className="text-xs text-gray-600">Interval</div>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-lg font-bold text-orange-600">
              {currentCard.totalReviews > 0 ? Math.round((currentCard.correctReviews / currentCard.totalReviews) * 100) : 0}%
            </div>
            <div className="text-xs text-gray-600">Accuracy</div>
          </div>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-8">
        <Flashcard
          question={currentCard.question}
          answer={currentCard.answer}
          type={currentCard.type}
          difficulty={currentCard.difficulty}
          showAnswer={showAnswer}
          onFlip={() => setShowAnswer(!showAnswer)}
        />
      </div>

      {/* Quality Assessment (6-point scale) */}
      {showAnswer && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
            How well did you know this?
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
            <QualityButton
              quality={0}
              label="Blackout"
              color="bg-red-700"
              description="Complete blackout - no recall at all"
            />
            <QualityButton
              quality={1}
              label="Hard"
              color="bg-red-600"
              description="Incorrect response, but familiar upon seeing answer"
            />
            <QualityButton
              quality={2}
              label="Hesitant"
              color="bg-orange-500"
              description="Correct response, but required significant effort"
            />
            <QualityButton
              quality={3}
              label="Recall"
              color="bg-yellow-500"
              description="Correct response with some hesitation"
            />
            <QualityButton
              quality={4}
              label="Easy"
              color="bg-green-500"
              description="Correct response with little hesitation"
            />
            <QualityButton
              quality={5}
              label="Perfect"
              color="bg-green-600"
              description="Perfect response - immediate and confident"
            />
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Your rating determines when you'll see this card next (SM-2 Algorithm)
          </p>
        </div>
      )}

      {!showAnswer && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">Think about your answer, then click the card to reveal it.</p>
        </div>
      )}
    </div>
  );
};

export default Review;
