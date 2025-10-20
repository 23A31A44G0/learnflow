import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PDFUploader from '../components/PDFUploader';
import MetacognitiveSummaryCard from '../components/MetacognitiveSummaryCard';
import UserLevelDisplay from '../components/UserLevelDisplay';
import DailyGoals from '../components/DailyGoals';
import StreakCounter from '../components/StreakCounter';
import BadgeDisplay from '../components/BadgeDisplay';

interface Question {
  _id: string;
  question: string;
  answer: string;
  type: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const [text, setText] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [showPDFUploader, setShowPDFUploader] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecentQuestions();
  }, []);

  const fetchRecentQuestions = async () => {
    try {
      const response = await api.get('/questions/recent');
      if (response.data && response.data.questions) {
        setRecentQuestions(response.data.questions.map((q: any, index: number) => ({
          ...q,
          _id: response.data._id, // Use QuestionSet ID for practice
          questionIndex: index // Store the index for reference
        })));
      }
    } catch (error) {
      console.error('Error fetching recent questions:', error);
    }
  };

  const generateQuestions = async (inputText: string = text) => {
    if (!inputText.trim()) {
      alert('Please enter some text or upload a PDF first.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/questions/generate', {
        text: inputText
      });

      if (response.data && response.data.questions) {
        // Map questions to include the QuestionSet ID for practice
        const questionsWithId = response.data.questions.map((q: any, index: number) => ({
          ...q,
          _id: response.data.id, // Use QuestionSet ID for practice
          questionIndex: index
        }));
        setQuestions(questionsWithId);
        fetchRecentQuestions();
      }
    } catch (error) {
      console.error('Error generating questions:', error);
      alert('Error generating questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPractice = (questionId: string) => {
    navigate(`/practice/${questionId}`);
  };

  const handlePDFProcessed = (pdfData: any) => {
    // Set the extracted text
    setText(pdfData.extractedText);
    
    // Set the generated questions
    setQuestions(pdfData.questions);
    
    // Show summary in an alert or modal (you can enhance this)
    alert(`PDF Processed!\n\nFile: ${pdfData.metadata.fileName}\nPages: ${pdfData.metadata.totalPages}\nSummary generated with ${pdfData.questions.length} questions.`);
    
    setShowPDFUploader(false);
  };

  const handleTextExtracted = (extractedText: string) => {
    setText(extractedText);
    setShowPDFUploader(false);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Transform your study materials into interactive learning sessions with AI-powered questions.
          </p>
        </div>

        {/* Input Methods Toggle */}
        <div className="mb-6">
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setShowPDFUploader(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !showPDFUploader
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📝 Text Input
            </button>
            <button
              onClick={() => setShowPDFUploader(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showPDFUploader
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📄 PDF Upload
            </button>
          </div>
        </div>

        {/* PDF Uploader */}
        {showPDFUploader && (
          <div className="mb-8">
            <PDFUploader
              onPDFProcessed={handlePDFProcessed}
              onTextExtracted={handleTextExtracted}
            />
          </div>
        )}

        {/* Text Input */}
        {!showPDFUploader && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Input Your Study Material
            </h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your lecture notes, textbook content, or any study material here..."
              className="w-full h-40 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="mt-4 flex justify-between items-center">
              <span className="text-sm text-gray-500">
                {text.length} characters
              </span>
              <button
                onClick={() => generateQuestions()}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Generating...' : 'Generate Questions'}
              </button>
            </div>
          </div>
        )}

        {/* Generated Questions */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generated Questions ({questions.length})
            </h2>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question._id || index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900">{question.question}</p>
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-sm text-gray-500 capitalize">
                      {question.type} Question
                    </span>
                    <button
                      onClick={() => startPractice(question._id)}
                      className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Level & Gamification */}
          <UserLevelDisplay />
          
          {/* Daily Goals */}
          <DailyGoals />
        </div>

        {/* Secondary Dashboard Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Metacognitive Summary Card */}
          <MetacognitiveSummaryCard />
          
          {/* Streak Counter */}
          <StreakCounter />
          
          {/* Badge Display */}
          <BadgeDisplay />
        </div>

        {/* Recent Questions */}
        {recentQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recent Questions
            </h2>
            <div className="space-y-3">
              {recentQuestions.slice(0, 5).map((question) => (
                <div key={question._id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="mb-3">
                    <p className="text-gray-900 font-medium mb-1">{question.question}</p>
                    <span className="text-xs text-gray-500">
                      {new Date(question.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => startPractice(question._id)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Start Practice
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
