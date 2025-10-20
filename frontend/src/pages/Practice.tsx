import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { questionsAPI, practiceAPI, QuestionSet, PracticeAnswer } from '../services/api';
import { useMetacognitive } from '../hooks/useMetacognitive';
import { useGamification } from '../context/GamificationContext';
import PromptModal from '../components/PromptModal';

const Practice: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PracticeAnswer[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [startTime] = useState(Date.now());

  const {
    isPromptOpen,
    currentPrompt,
    promptType,
    promptContext,
    triggerPostPracticePrompt,
    handleReflectionSubmit,
    closePrompt
  } = useMetacognitive({
    onReflectionComplete: () => {
      // Navigate to dashboard after reflection is complete
      setTimeout(() => navigate('/dashboard'), 1000);
    }
  });

  const { processGamificationResult } = useGamification();

  useEffect(() => {
    if (id) {
      fetchQuestionSet();
    }
  }, [id]);

  const fetchQuestionSet = async () => {
    try {
      const set = await questionsAPI.getQuestionSet(id!);
      setQuestionSet(set);
      setLoading(false);
    } catch (err) {
      setError('Failed to load question set');
      setLoading(false);
    }
  };

  const handleAnswerSubmit = () => {
    if (!questionSet || !userAnswer.trim()) return;

    const newAnswer: PracticeAnswer = {
      questionIndex: currentQuestionIndex,
      userAnswer: userAnswer.trim(),
      timeTaken: 0 // Could add timer functionality later
    };

    setAnswers([...answers, newAnswer]);
    setShowAnswer(true);
  };

  const handleNextQuestion = () => {
    if (!questionSet) return;

    setUserAnswer('');
    setShowAnswer(false);

    if (currentQuestionIndex < questionSet.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Practice complete, submit results
      submitPracticeSession();
    }
  };

  const submitPracticeSession = async () => {
    if (!questionSet) return;

    setSubmitting(true);
    try {
      const practiceResult = await practiceAPI.submit(questionSet._id, answers);
      setResult(practiceResult);
      setCompleted(true);

      // Process gamification results from backend
      if (practiceResult.gamification) {
        processGamificationResult(practiceResult.gamification);
      }

      // Trigger metacognitive prompt after practice
      const timeSpent = Date.now() - startTime;
      const concepts = questionSet.questions.map(q => q.type).filter((type, index, self) => self.indexOf(type) === index);
      
      triggerPostPracticePrompt({
        score: practiceResult.score,
        totalQuestions: practiceResult.totalQuestions,
        correctAnswers: practiceResult.correctAnswers,
        timeSpent,
        concepts
      });
    } catch (err) {
      setError('Failed to submit practice session');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (completed && result) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Practice Complete!</h2>
            <p className="mt-2 text-lg text-gray-600">Great job on completing the practice session</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-primary-50 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-primary-600">Your Score</p>
              <p className="text-3xl font-bold text-primary-900">{result.score}%</p>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-green-600">Correct Answers</p>
              <p className="text-3xl font-bold text-green-900">{result.correctAnswers}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <p className="text-sm font-medium text-blue-600">Total Questions</p>
              <p className="text-3xl font-bold text-blue-900">{result.totalQuestions}</p>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Review Your Answers:</h3>
            {result.answers.map((answer: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">
                  Q{index + 1}: {questionSet?.questions[answer.questionIndex]?.question}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Your Answer:</p>
                    <p className={`${answer.isCorrect ? 'text-green-600' : 'text-red-600'} font-medium`}>
                      {answer.userAnswer}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Correct Answer:</p>
                    <p className="text-green-600 font-medium">
                      {questionSet?.questions[answer.questionIndex]?.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
            >
              View Analytics
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!questionSet) return null;

  const currentQuestion = questionSet.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questionSet.questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
            <span className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {questionSet.questions.length}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-600 h-2 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question */}
        <div className="mb-8">
          <h2 className="text-xl font-medium text-gray-900 mb-4">
            {currentQuestion.question}
          </h2>

          {!showAnswer ? (
            <div className="space-y-4">
              <textarea
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                placeholder="Type your answer here..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
              />
              <button
                onClick={handleAnswerSubmit}
                disabled={!userAnswer.trim()}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Answer
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                <p className="text-gray-900 font-medium">{userAnswer}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-md">
                <p className="text-sm text-green-700 mb-1">Correct Answer:</p>
                <p className="text-green-800 font-medium">{currentQuestion.answer}</p>
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={submitting}
                className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 
                 currentQuestionIndex < questionSet.questions.length - 1 ? 'Next Question' : 'Finish Practice'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Metacognitive Prompt Modal */}
      <PromptModal
        isOpen={isPromptOpen}
        onClose={closePrompt}
        onSubmit={handleReflectionSubmit}
        prompt={currentPrompt}
        promptType={promptType}
        context={promptContext}
      />
    </div>
  );
};

export default Practice;
