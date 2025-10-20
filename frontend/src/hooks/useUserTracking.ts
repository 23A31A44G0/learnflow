import { useState, useEffect } from 'react';
import { analytics } from '../services/analytics';

interface UserSession {
  sessionStart: Date;
  questionsGenerated: number;
  questionsAnswered: number;
  accuracy: number;
  featuresUsed: string[];
}

export const useUserTracking = () => {
  const [session, setSession] = useState<UserSession>({
    sessionStart: new Date(),
    questionsGenerated: 0,
    questionsAnswered: 0,
    accuracy: 0,
    featuresUsed: [],
  });

  useEffect(() => {
    // Track session start
    analytics.trackEvent({
      action: 'session_start',
      category: 'user_behavior',
    });

    // Track session duration on page unload
    const handleBeforeUnload = () => {
      const sessionDuration = Math.round((Date.now() - session.sessionStart.getTime()) / 1000);
      analytics.trackEvent({
        action: 'session_duration',
        category: 'user_behavior',
        value: sessionDuration,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const trackQuestionGeneration = (count: number, type: 'text' | 'pdf') => {
    setSession(prev => ({
      ...prev,
      questionsGenerated: prev.questionsGenerated + count,
      featuresUsed: prev.featuresUsed.includes('question_generation') 
        ? prev.featuresUsed 
        : [...prev.featuresUsed, 'question_generation'],
    }));
    analytics.trackQuestionGeneration(count, type);
  };

  const trackPracticeCompletion = (answered: number, accuracy: number) => {
    setSession(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + answered,
      accuracy: accuracy,
      featuresUsed: prev.featuresUsed.includes('practice_mode')
        ? prev.featuresUsed
        : [...prev.featuresUsed, 'practice_mode'],
    }));
    analytics.trackPracticeSession(answered, accuracy);
  };

  const trackFeatureUse = (feature: string) => {
    setSession(prev => ({
      ...prev,
      featuresUsed: prev.featuresUsed.includes(feature)
        ? prev.featuresUsed
        : [...prev.featuresUsed, feature],
    }));
    analytics.trackFeatureUsage(feature, 'used');
  };

  const trackSpacedRepetitionUse = (quality: number, cardType: string) => {
    setSession(prev => ({
      ...prev,
      featuresUsed: prev.featuresUsed.includes('spaced_repetition')
        ? prev.featuresUsed
        : [...prev.featuresUsed, 'spaced_repetition'],
    }));
    analytics.trackSpacedRepetition(quality, cardType);
  };

  return {
    session,
    trackQuestionGeneration,
    trackPracticeCompletion,
    trackFeatureUse,
    trackSpacedRepetitionUse,
  };
};
