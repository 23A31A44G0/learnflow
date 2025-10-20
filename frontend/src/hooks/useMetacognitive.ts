import { useState, useCallback } from 'react';
import { metacognitiveAPI } from '../services/api';

interface UseMetacognitiveProps {
  onReflectionComplete?: (reflection: any) => void;
}

export const useMetacognitive = ({ onReflectionComplete }: UseMetacognitiveProps = {}) => {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [promptType, setPromptType] = useState<string>('');
  const [promptContext, setPromptContext] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const triggerPrompt = useCallback(async (
    type: 'comprehension' | 'strategy' | 'confidence' | 'difficulty' | 'connection',
    context: {
      sessionType?: string;
      performanceScore?: number;
      conceptsStudied?: string[];
      timeSpent?: number;
      difficultyLevel?: string;
      specificConcept?: string;
      questionCount?: number;
      correctAnswers?: number;
    }
  ) => {
    setLoading(true);
    try {
      const response = await metacognitiveAPI.getPrompt(type, context);
      setCurrentPrompt(response.prompt);
      setPromptType(type);
      setPromptContext(context);
      setIsPromptOpen(true);
    } catch (error) {
      console.error('Error fetching metacognitive prompt:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReflectionSubmit = useCallback((reflection: any) => {
    onReflectionComplete?.(reflection);
    setIsPromptOpen(false);
  }, [onReflectionComplete]);

  const closePrompt = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  // Trigger prompts based on learning events
  const triggerPostPracticePrompt = useCallback((practiceResult: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    timeSpent: number;
    concepts?: string[];
  }) => {
    // Decide which type of prompt to show based on performance
    if (practiceResult.score < 50) {
      triggerPrompt('difficulty', {
        sessionType: 'practice',
        performanceScore: practiceResult.score,
        conceptsStudied: practiceResult.concepts,
        timeSpent: practiceResult.timeSpent,
        questionCount: practiceResult.totalQuestions,
        correctAnswers: practiceResult.correctAnswers,
        difficultyLevel: 'challenging'
      });
    } else if (practiceResult.score >= 80) {
      triggerPrompt('confidence', {
        sessionType: 'practice',
        performanceScore: practiceResult.score,
        conceptsStudied: practiceResult.concepts,
        timeSpent: practiceResult.timeSpent,
        questionCount: practiceResult.totalQuestions,
        correctAnswers: practiceResult.correctAnswers,
        difficultyLevel: 'manageable'
      });
    } else {
      triggerPrompt('comprehension', {
        sessionType: 'practice',
        performanceScore: practiceResult.score,
        conceptsStudied: practiceResult.concepts,
        timeSpent: practiceResult.timeSpent,
        questionCount: practiceResult.totalQuestions,
        correctAnswers: practiceResult.correctAnswers
      });
    }
  }, [triggerPrompt]);

  const triggerPostStudyPrompt = useCallback((studyContext: {
    conceptsStudied: string[];
    timeSpent: number;
    studyType: 'reading' | 'explanation' | 'concept_mapping';
  }) => {
    if (studyContext.studyType === 'concept_mapping') {
      triggerPrompt('connection', {
        sessionType: 'concept_mapping',
        conceptsStudied: studyContext.conceptsStudied,
        timeSpent: studyContext.timeSpent
      });
    } else {
      triggerPrompt('strategy', {
        sessionType: studyContext.studyType,
        conceptsStudied: studyContext.conceptsStudied,
        timeSpent: studyContext.timeSpent
      });
    }
  }, [triggerPrompt]);

  return {
    isPromptOpen,
    currentPrompt,
    promptType,
    promptContext,
    loading,
    triggerPrompt,
    triggerPostPracticePrompt,
    triggerPostStudyPrompt,
    handleReflectionSubmit,
    closePrompt
  };
};
