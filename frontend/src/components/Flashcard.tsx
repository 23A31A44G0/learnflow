import React, { useState } from 'react';

interface FlashcardProps {
  question: string;
  answer: string;
  type: string;
  difficulty?: string;
  onFlip?: () => void;
  showAnswer?: boolean;
}

const Flashcard: React.FC<FlashcardProps> = ({
  question,
  answer,
  type,
  difficulty = 'medium',
  onFlip,
  showAnswer = false
}) => {
  const [isFlipped, setIsFlipped] = useState(showAnswer);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (onFlip) onFlip();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case 'flashcard': return '🎯';
      case 'multiple-choice': return '✅';
      case 'fill-blank': return '📝';
      case 'comprehension': return '🧠';
      default: return '❓';
    }
  };

  return (
    <div 
      className={`
        relative w-full max-w-md mx-auto h-64 cursor-pointer
        transform transition-transform duration-300 hover:scale-105
        ${isFlipped ? '[transform-style:preserve-3d] [transform:rotateY(180deg)]' : ''}
      `}
      onClick={handleFlip}
    >
      {/* Front of card (Question) */}
      <div className={`
        absolute inset-0 w-full h-full rounded-xl shadow-lg
        bg-white border-2 border-blue-200
        flex flex-col justify-between p-6
        ${isFlipped ? '[transform:rotateY(180deg)] opacity-0' : 'opacity-100'}
        transition-opacity duration-150
      `}>
        <div className="flex justify-between items-start mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(difficulty)}`}>
            {difficulty}
          </span>
          <span className="text-2xl">{getTypeIcon(type)}</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {question}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Click to reveal answer</p>
          <div className="mt-2 text-blue-500">
            <svg className="w-5 h-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Back of card (Answer) */}
      <div className={`
        absolute inset-0 w-full h-full rounded-xl shadow-lg
        bg-green-50 border-2 border-green-200
        flex flex-col justify-between p-6
        ${isFlipped ? 'opacity-100' : '[transform:rotateY(180deg)] opacity-0'}
        transition-opacity duration-150
      `}>
        <div className="flex justify-between items-start mb-4">
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Answer
          </span>
          <span className="text-2xl">✅</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center text-center">
          <p className="text-lg font-medium text-gray-800 leading-relaxed">
            {answer}
          </p>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500">Click to see question again</p>
          <div className="mt-2 text-green-500">
            <svg className="w-5 h-5 mx-auto transform rotate-180" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flashcard;