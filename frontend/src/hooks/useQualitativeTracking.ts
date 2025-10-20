import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../services/analytics';

interface UserAction {
  action: string;
  feature: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface QualitativeInsight {
  type: 'frustration' | 'delight' | 'confusion' | 'discovery';
  event: string;
  context: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  features: string[];
  actions: UserAction[];
  pageViews: string[];
  qualitativeInsights: QualitativeInsight[];
  taskCompletionTimes: { [task: string]: number };
  engagementScore: number;
}

export const useQualitativeTracking = () => {
  const sessionRef = useRef<UserSession | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const clickCountRef = useRef<{ [key: string]: { count: number; lastClick: number } }>({});
  const taskStartTimes = useRef<{ [key: string]: number }>({});

  useEffect(() => {
    initializeSession();
    attachBasicListeners();

    return () => {
      endSession();
    };
  }, []);

  const initializeSession = () => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionRef.current = {
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      features: [],
      actions: [],
      pageViews: [window.location.pathname],
      qualitativeInsights: [],
      taskCompletionTimes: {},
      engagementScore: 0
    };

    analytics.trackEvent({
      action: 'session_start',
      category: 'user_behavior',
      label: sessionId
    });
  };

  const attachBasicListeners = () => {
    document.addEventListener('click', handleClick, true);
    document.addEventListener('scroll', updateActivity);
    document.addEventListener('keypress', updateActivity);
    window.addEventListener('beforeunload', endSession);
  };

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (sessionRef.current) {
      sessionRef.current.lastActivity = Date.now();
    }
  }, []);

  const handleClick = (event: MouseEvent) => {
    updateActivity();
    detectRapidClicks(event);
  };

  const detectRapidClicks = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const elementKey = target.tagName + (target.id ? `#${target.id}` : '');
    const now = Date.now();

    if (!clickCountRef.current[elementKey]) {
      clickCountRef.current[elementKey] = { count: 0, lastClick: 0 };
    }

    const clickData = clickCountRef.current[elementKey];
    
    if (now - clickData.lastClick < 500) {
      clickData.count++;
      
      if (clickData.count >= 3) {
        trackQualitativeInsight('frustration', 'rapid_clicks', elementKey, {
          click_count: clickData.count,
          element_text: target.textContent?.slice(0, 50)
        });
      }
    } else {
      clickData.count = 1;
    }
    
    clickData.lastClick = now;
  };

  // Public tracking methods for qualitative insights
  const trackFeatureUsage = (feature: string, discoveryMethod?: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const isNewFeature = !sessionRef.current.features.includes(feature);
    
    if (isNewFeature) {
      sessionRef.current.features.push(feature);
      
      trackQualitativeInsight('discovery', 'feature_first_use', feature, {
        discovery_method: discoveryMethod || 'organic',
        time_to_discover: Date.now() - sessionRef.current.startTime,
        ...metadata
      });
    }

    const action: UserAction = {
      action: 'feature_used',
      feature,
      metadata: {
        is_first_use: isNewFeature,
        page: window.location.pathname,
        ...metadata
      },
      timestamp: Date.now()
    };

    sessionRef.current.actions.push(action);

    analytics.trackEvent({
      action: 'feature_usage',
      category: 'engagement',
      label: feature,
      value: isNewFeature ? 1 : 0
    });
  };

  const trackTaskStart = (taskName: string) => {
    taskStartTimes.current[taskName] = Date.now();
    
    analytics.trackEvent({
      action: 'task_start',
      category: 'user_flow',
      label: taskName
    });
  };

  const trackTaskCompletion = (taskName: string, success: boolean = true, userFeedback?: string) => {
    const startTime = taskStartTimes.current[taskName];
    if (!startTime) return;

    const completionTime = Date.now() - startTime;
    delete taskStartTimes.current[taskName];

    if (sessionRef.current) {
      sessionRef.current.taskCompletionTimes[taskName] = completionTime;
    }

    // Track qualitative insights based on completion
    if (success && completionTime < 30000) {
      trackQualitativeInsight('delight', 'quick_completion', taskName, {
        completion_time_ms: completionTime,
        user_feedback: userFeedback
      });
    } else if (!success || completionTime > 120000) {
      trackQualitativeInsight('frustration', 'slow_completion', taskName, {
        completion_time_ms: completionTime,
        success,
        user_feedback: userFeedback
      });
    }

    analytics.trackEvent({
      action: 'task_completion',
      category: 'user_flow',
      label: taskName,
      value: Math.round(completionTime / 1000) // Duration in seconds
    });
  };

  const trackUserFrustration = (reason: string, context: string, metadata?: Record<string, any>) => {
    trackQualitativeInsight('frustration', reason, context, metadata);
    
    analytics.trackEvent({
      action: 'user_frustration',
      category: 'usability',
      label: `${reason}_${context}`
    });
  };

  const trackUserDelight = (reason: string, context: string, intensity: number = 1, metadata?: Record<string, any>) => {
    trackQualitativeInsight('delight', reason, context, {
      intensity,
      ...metadata
    });
    
    analytics.trackEvent({
      action: 'user_delight',
      category: 'engagement',
      label: `${reason}_${context}`,
      value: intensity
    });
  };

  const trackUserConfusion = (element: string, expectedAction: string, actualBehavior: string) => {
    trackQualitativeInsight('confusion', 'ui_confusion', element, {
      expected_action: expectedAction,
      actual_behavior: actualBehavior,
      page: window.location.pathname
    });
    
    analytics.trackEvent({
      action: 'user_confusion',
      category: 'usability',
      label: element
    });
  };

  const trackLearningMoment = (concept: string, understanding: 'clear' | 'confused' | 'frustrated') => {
    const insightType = understanding === 'clear' ? 'delight' : understanding === 'confused' ? 'confusion' : 'frustration';
    
    trackQualitativeInsight(insightType, 'learning_moment', concept, {
      understanding_level: understanding,
      context: 'educational_content'
    });
    
    analytics.trackEvent({
      action: 'learning_moment',
      category: 'education',
      label: concept,
      value: understanding === 'clear' ? 1 : 0
    });
  };

  const trackStudySession = (subject: string, questionsGenerated: number, accuracy: number, timeSpent: number) => {
    const isEffectiveSession = accuracy > 70 && questionsGenerated > 5;
    
    if (isEffectiveSession) {
      trackQualitativeInsight('delight', 'effective_study', subject, {
        questions_generated: questionsGenerated,
        accuracy,
        time_spent_minutes: Math.round(timeSpent / 60000)
      });
    }
    
    analytics.trackEvent({
      action: 'study_session',
      category: 'learning',
      label: subject,
      value: Math.round(accuracy)
    });
  };

  const trackQualitativeInsight = (type: QualitativeInsight['type'], event: string, context: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const insight: QualitativeInsight = {
      type,
      event,
      context,
      timestamp: Date.now(),
      metadata
    };

    sessionRef.current.qualitativeInsights.push(insight);
    
    // Update engagement score based on insights
    updateEngagementScore(type);
  };

  const updateEngagementScore = (insightType: QualitativeInsight['type']) => {
    if (!sessionRef.current) return;
    
    switch (insightType) {
      case 'delight':
        sessionRef.current.engagementScore += 2;
        break;
      case 'discovery':
        sessionRef.current.engagementScore += 1;
        break;
      case 'frustration':
        sessionRef.current.engagementScore -= 1;
        break;
      case 'confusion':
        sessionRef.current.engagementScore -= 0.5;
        break;
    }
    
    // Keep score between 0 and 10
    sessionRef.current.engagementScore = Math.max(0, Math.min(10, sessionRef.current.engagementScore));
  };

  const generateQualitativeReport = () => {
    if (!sessionRef.current) return null;

    const session = sessionRef.current;
    const insights = session.qualitativeInsights;
    
    // Categorize insights
    const frustrations = insights.filter(i => i.type === 'frustration');
    const delights = insights.filter(i => i.type === 'delight');
    const confusions = insights.filter(i => i.type === 'confusion');
    const discoveries = insights.filter(i => i.type === 'discovery');
    
    // Calculate key metrics for qualitative analysis
    const sessionDuration = Date.now() - session.startTime;
    const avgTaskCompletionTime = Object.values(session.taskCompletionTimes).length > 0 
      ? Object.values(session.taskCompletionTimes).reduce((a, b) => a + b, 0) / Object.values(session.taskCompletionTimes).length 
      : 0;
    
    return {
      sessionId: session.sessionId,
      duration: sessionDuration,
      engagementScore: session.engagementScore,
      featuresDiscovered: session.features.length,
      insights: {
        total: insights.length,
        frustrations: frustrations.length,
        delights: delights.length,
        confusions: confusions.length,
        discoveries: discoveries.length
      },
      patterns: {
        mostFrustratingFeature: getMostCommonContext(frustrations),
        mostDelightfulFeature: getMostCommonContext(delights),
        commonConfusionPoints: getMostCommonContext(confusions),
        discoveryMethods: discoveries.map(d => d.metadata?.discovery_method).filter(Boolean)
      },
      performance: {
        avgTaskCompletionTime: Math.round(avgTaskCompletionTime),
        tasksCompleted: Object.keys(session.taskCompletionTimes).length,
        pagesVisited: session.pageViews.length
      },
      recommendations: generateRecommendations(session)
    };
  };

  const getMostCommonContext = (insights: QualitativeInsight[]): string => {
    const contexts = insights.map(i => i.context);
    const frequency: { [key: string]: number } = {};
    
    contexts.forEach(context => {
      frequency[context] = (frequency[context] || 0) + 1;
    });
    
    return Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b, '');
  };

  const generateRecommendations = (session: UserSession): string[] => {
    const recommendations: string[] = [];
    const insights = session.qualitativeInsights;
    
    // Analyze frustration patterns
    const frustrations = insights.filter(i => i.type === 'frustration');
    if (frustrations.length > 3) {
      recommendations.push('High frustration detected - consider UI/UX improvements');
    }
    
    // Analyze confusion patterns
    const confusions = insights.filter(i => i.type === 'confusion');
    if (confusions.length > 2) {
      recommendations.push('User confusion detected - improve instructions or UI clarity');
    }
    
    // Analyze engagement
    if (session.engagementScore < 3) {
      recommendations.push('Low engagement - consider gamification or better onboarding');
    } else if (session.engagementScore > 7) {
      recommendations.push('High engagement - user is having a positive experience');
    }
    
    // Analyze feature discovery
    if (session.features.length < 3) {
      recommendations.push('Limited feature discovery - improve feature discoverability');
    }
    
    return recommendations;
  };

  const sendQualitativeData = async () => {
    if (!sessionRef.current) return;

    const report = generateQualitativeReport();
    
    try {
      await fetch('/api/analytics/qualitative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send qualitative data:', error);
    }
  };

  const endSession = () => {
    if (sessionRef.current) {
      analytics.trackEvent({
        action: 'session_end',
        category: 'user_behavior',
        label: sessionRef.current.sessionId,
        value: Math.round((Date.now() - sessionRef.current.startTime) / 1000)
      });

      sendQualitativeData();
    }
  };

  return {
    trackFeatureUsage,
    trackTaskStart,
    trackTaskCompletion,
    trackUserFrustration,
    trackUserDelight,
    trackUserConfusion,
    trackLearningMoment,
    trackStudySession,
    generateQualitativeReport,
    session: sessionRef.current
  };
};
