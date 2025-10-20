import { useEffect, useRef, useCallback } from 'react';
import { analytics } from '../services/analytics';

interface UserAction {
  action: string;
  feature: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

interface FrustrationEvent {
  type: 'rapid_clicks' | 'back_button_spam' | 'form_resubmit' | 'page_reload' | 'error_encountered';
  timestamp: number;
  context: string;
  metadata?: Record<string, any>;
}

interface DelightEvent {
  type: 'quick_task_completion' | 'feature_discovery' | 'successful_flow' | 'time_saved';
  timestamp: number;
  context: string;
  value: number;
  metadata?: Record<string, any>;
}

interface UsabilityIssue {
  type: 'confusing_ui' | 'slow_performance' | 'unclear_instructions' | 'feature_not_found';
  timestamp: number;
  element: string;
  userAction: string;
  metadata?: Record<string, any>;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  lastActivity: number;
  features: string[];
  actions: UserAction[];
  pageViews: string[];
  frustrationEvents: FrustrationEvent[];
  delightEvents: DelightEvent[];
  usabilityIssues: UsabilityIssue[];
  qualitativeData: {
    taskCompletionTimes: { [task: string]: number };
    featureDiscoveryMethods: { [feature: string]: string };
    userJourney: string[];
    engagementScore: number;
  };
}

export const useAdvancedUserTracking = () => {
  const sessionRef = useRef<UserSession | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const clickCountRef = useRef<{ [key: string]: { count: number; lastClick: number } }>({});
  const taskStartTimes = useRef<{ [key: string]: number }>({});
  const pageLoadTimes = useRef<{ [page: string]: number }>({});
  const scrollDepthRef = useRef<{ [page: string]: number | boolean }>({});

  useEffect(() => {
    initializeSession();
    attachEventListeners();

    return () => {
      endSession();
      removeEventListeners();
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
      frustrationEvents: [],
      delightEvents: [],
      usabilityIssues: [],
      qualitativeData: {
        taskCompletionTimes: {},
        featureDiscoveryMethods: {},
        userJourney: [window.location.pathname],
        engagementScore: 0
      }
    };

    // Track initial page load time
    pageLoadTimes.current[window.location.pathname] = performance.now();
    
    // Send session start event
    analytics.trackEvent({
      action: 'session_start',
      category: 'user_behavior',
      label: sessionId
    });
  };

  const attachEventListeners = () => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('scroll', handleScroll);
    document.addEventListener('keypress', handleKeyPress);
    document.addEventListener('submit', handleFormSubmit, true);
    window.addEventListener('error', handleError);
    window.addEventListener('popstate', handleBackButton);
    window.addEventListener('beforeunload', handleBeforeUnload);
  };

  const removeEventListeners = () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('scroll', handleScroll);
    document.removeEventListener('keypress', handleKeyPress);
    document.removeEventListener('submit', handleFormSubmit, true);
    window.removeEventListener('error', handleError);
    window.removeEventListener('popstate', handleBackButton);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (sessionRef.current) {
      sessionRef.current.lastActivity = Date.now();
    }
  }, []);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      endSession();
    } else {
      updateActivity();
      // Track return to page
      analytics.trackEvent({
        action: 'page_refocused',
        category: 'user_behavior',
        label: window.location.pathname
      });
    }
  };

  const handleClick = (event: MouseEvent) => {
    updateActivity();
    detectRapidClicks(event);
    trackClickPattern(event);
  };

  const handleScroll = () => {
    updateActivity();
    trackScrollBehavior();
  };

  const handleKeyPress = () => {
    updateActivity();
  };

  const handleFormSubmit = (event: Event) => {
    const form = event.target as HTMLFormElement;
    trackFormInteraction(form, 'submit');
  };

  const handleError = (event: ErrorEvent) => {
    trackError(event.message, event.filename, event.lineno);
  };

  const handleBackButton = () => {
    trackFrustrationEvent('back_button_spam', window.location.pathname, {
      consecutive_backs: getConsecutiveBackCount()
    });
  };

  const handleBeforeUnload = () => {
    sendSessionData();
  };

  // Enhanced tracking methods
  const detectRapidClicks = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    const elementKey = getElementKey(target);
    const now = Date.now();

    if (!clickCountRef.current[elementKey]) {
      clickCountRef.current[elementKey] = { count: 0, lastClick: 0 };
    }

    const clickData = clickCountRef.current[elementKey];
    
    if (now - clickData.lastClick < 500) { // Clicks within 500ms
      clickData.count++;
      
      if (clickData.count >= 3) {
        trackFrustrationEvent('rapid_clicks', elementKey, {
          click_count: clickData.count,
          time_span: now - (clickData.lastClick - 500 * (clickData.count - 1)),
          element_type: target.tagName,
          element_text: target.textContent?.slice(0, 50)
        });
      }
    } else {
      clickData.count = 1;
    }
    
    clickData.lastClick = now;
  };

  const trackClickPattern = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    
    // Track clicks on buttons, links, and interactive elements
    if (target.tagName === 'BUTTON' || target.tagName === 'A' || target.closest('[role="button"]')) {
      analytics.trackEvent({
        action: 'element_click',
        category: 'user_interaction',
        label: `${target.tagName}_${target.textContent?.slice(0, 30) || 'no_text'}`
      });
    }
  };

  const trackScrollBehavior = () => {
    const page = window.location.pathname;
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );

    const currentDepth = scrollDepthRef.current[page];
    if (typeof currentDepth !== 'number' || scrollPercent > currentDepth) {
      scrollDepthRef.current[page] = scrollPercent;
      
      // Track significant scroll milestones
      if (scrollPercent >= 25 && scrollPercent < 50 && !scrollDepthRef.current[`${page}_25`]) {
        analytics.trackEvent({
          action: 'page_scroll',
          category: 'engagement',
          label: page,
          value: 25
        });
        scrollDepthRef.current[`${page}_25`] = true;
      } else if (scrollPercent >= 50 && scrollPercent < 75 && !scrollDepthRef.current[`${page}_50`]) {
        analytics.trackEvent({
          action: 'page_scroll',
          category: 'engagement',
          label: page,
          value: 50
        });
        scrollDepthRef.current[`${page}_50`] = true;
      } else if (scrollPercent >= 75 && !scrollDepthRef.current[`${page}_75`]) {
        analytics.trackEvent({
          action: 'page_scroll',
          category: 'engagement',
          label: page,
          value: 75
        });
        scrollDepthRef.current[`${page}_75`] = true;
      }
    }
  };

  const trackFormInteraction = (form: HTMLFormElement, action: string) => {
    const formData = new FormData(form);
    const fields = Array.from(formData.keys());
    
    analytics.trackEvent({
      action: 'form_interaction',
      category: 'user_interaction',
      label: `${action}_${form.id || 'unnamed_form'}`,
      value: fields.length
    });

    if (action === 'submit') {
      // Check for potential frustration (multiple submissions)
      const submitCount = (form as any)._submitCount || 0;
      (form as any)._submitCount = submitCount + 1;
      
      if (submitCount > 1) {
        trackFrustrationEvent('form_resubmit', `form_${form.id}`, {
          submit_count: submitCount + 1,
          fields: fields.length
        });
      }
    }
  };

  const trackError = (message: string, filename?: string, lineno?: number) => {
    trackFrustrationEvent('error_encountered', window.location.pathname, {
      error_message: message,
      filename,
      line_number: lineno
    });

    analytics.trackEvent({
      action: 'javascript_error',
      category: 'error',
      label: message.slice(0, 100)
    });
  };

  // Public tracking methods
  const trackFeatureUsage = (feature: string, discoveryMethod?: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const isNewFeature = !sessionRef.current.features.includes(feature);
    
    if (isNewFeature) {
      sessionRef.current.features.push(feature);
      
      // Track feature discovery
      if (discoveryMethod) {
        sessionRef.current.qualitativeData.featureDiscoveryMethods[feature] = discoveryMethod;
      }
      
      trackDelightEvent('feature_discovery', feature, 1, {
        discovery_method: discoveryMethod || 'unknown',
        time_to_discover: Date.now() - sessionRef.current.startTime,
        ...metadata
      });
    }

    // Track the usage action
    const action: UserAction = {
      action: 'feature_used',
      feature,
      metadata: {
        is_first_use: isNewFeature,
        page: window.location.pathname,
        time_since_session_start: Date.now() - sessionRef.current.startTime,
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
  };

  const trackTaskCompletion = (taskName: string, success: boolean = true) => {
    const startTime = taskStartTimes.current[taskName];
    if (!startTime) return;

    const completionTime = Date.now() - startTime;
    delete taskStartTimes.current[taskName];

    if (sessionRef.current) {
      sessionRef.current.qualitativeData.taskCompletionTimes[taskName] = completionTime;
    }

    // Track delight for quick completions
    if (success && completionTime < 30000) { // Less than 30 seconds
      trackDelightEvent('quick_task_completion', taskName, Math.max(1, 60 - completionTime / 1000), {
        completion_time_ms: completionTime
      });
    }

    analytics.trackEvent({
      action: 'task_completion',
      category: 'user_flow',
      label: taskName,
      value: Math.round(completionTime / 1000)
    });
  };

  const trackFrustrationEvent = (type: FrustrationEvent['type'], context: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const event: FrustrationEvent = {
      type,
      timestamp: Date.now(),
      context,
      metadata
    };

    sessionRef.current.frustrationEvents.push(event);

    analytics.trackEvent({
      action: 'user_frustration',
      category: 'usability',
      label: `${type}_${context}`
    });
  };

  const trackDelightEvent = (type: DelightEvent['type'], context: string, value: number, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const event: DelightEvent = {
      type,
      timestamp: Date.now(),
      context,
      value,
      metadata
    };

    sessionRef.current.delightEvents.push(event);

    analytics.trackEvent({
      action: 'user_delight',
      category: 'engagement',
      label: `${type}_${context}`,
      value: value
    });
  };

  const trackUsabilityIssue = (type: UsabilityIssue['type'], element: string, userAction: string, metadata?: Record<string, any>) => {
    if (!sessionRef.current) return;

    const issue: UsabilityIssue = {
      type,
      timestamp: Date.now(),
      element,
      userAction,
      metadata
    };

    sessionRef.current.usabilityIssues.push(issue);

    analytics.trackEvent({
      action: 'usability_issue',
      category: 'usability',
      label: `${type}_${element}`
    });
  };

  const trackPageView = (path?: string) => {
    const currentPath = path || window.location.pathname;
    
    if (sessionRef.current) {
      sessionRef.current.pageViews.push(currentPath);
      sessionRef.current.qualitativeData.userJourney.push(currentPath);
    }

    // Track page load performance
    const loadTime = pageLoadTimes.current[currentPath];
    if (loadTime && performance.now() - loadTime > 3000) { // Slow load (>3s)
      trackUsabilityIssue('slow_performance', currentPath, 'page_load', {
        load_time_ms: performance.now() - loadTime
      });
    }

    analytics.trackEvent({
      action: 'page_view',
      category: 'navigation',
      label: currentPath
    });
  };

  const sendSessionData = async () => {
    if (!sessionRef.current) return;

    const sessionData = {
      ...sessionRef.current,
      duration: Date.now() - sessionRef.current.startTime,
      pages_visited: sessionRef.current.pageViews.length,
      unique_pages: new Set(sessionRef.current.pageViews).size,
      features_discovered: sessionRef.current.features.length,
      frustration_score: calculateFrustrationScore(),
      delight_score: calculateDelightScore(),
      engagement_score: calculateEngagementScore()
    };

    try {
      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
    } catch (error) {
      console.error('Failed to send session data:', error);
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

      sendSessionData();
    }
  };

  // Helper functions
  const getElementKey = (element: HTMLElement): string => {
    return element.id || element.className || element.tagName || 'unknown';
  };

  const getConsecutiveBackCount = (): number => {
    // Implementation would track navigation history
    return 1; // Simplified
  };

  const calculateFrustrationScore = (): number => {
    if (!sessionRef.current) return 0;
    
    const events = sessionRef.current.frustrationEvents;
    let score = 0;
    
    events.forEach(event => {
      switch (event.type) {
        case 'rapid_clicks': score += 2; break;
        case 'back_button_spam': score += 3; break;
        case 'form_resubmit': score += 4; break;
        case 'page_reload': score += 3; break;
        case 'error_encountered': score += 5; break;
      }
    });
    
    return Math.min(score, 10); // Cap at 10
  };

  const calculateDelightScore = (): number => {
    if (!sessionRef.current) return 0;
    
    return sessionRef.current.delightEvents.reduce((sum, event) => sum + event.value, 0);
  };

  const calculateEngagementScore = (): number => {
    if (!sessionRef.current) return 0;
    
    const session = sessionRef.current;
    const sessionDuration = Date.now() - session.startTime;
    const actionsPerMinute = (session.actions.length / (sessionDuration / 60000)) || 0;
    const featureDiscoveryRate = session.features.length / Math.max(1, session.pageViews.length);
    const frustrationPenalty = calculateFrustrationScore() * 0.5;
    const delightBonus = calculateDelightScore() * 0.3;
    
    return Math.max(0, Math.min(10, actionsPerMinute + featureDiscoveryRate + delightBonus - frustrationPenalty));
  };

  return {
    trackFeatureUsage,
    trackTaskStart,
    trackTaskCompletion,
    trackFrustrationEvent,
    trackDelightEvent,
    trackUsabilityIssue,
    trackPageView,
    sendSessionData,
    session: sessionRef.current
  };
};
