export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

class AnalyticsService {
  private gtag: any;

  constructor() {
    this.gtag = (window as any).gtag;
  }

  // Initialize Google Analytics
  initialize(measurementId: string) {
    if (typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };
      
      this.gtag = (window as any).gtag;
      this.gtag('js', new Date());
      this.gtag('config', measurementId);
    }
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (this.gtag) {
      this.gtag('config', process.env.REACT_APP_GA_MEASUREMENT_ID, {
        page_path: path,
        page_title: title,
      });
    }
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (this.gtag) {
      this.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
      });
    }
  }

  // Track LearnFlow specific events
  trackQuestionGeneration(questionCount: number, sourceType: 'text' | 'pdf') {
    this.trackEvent({
      action: 'generate_questions',
      category: 'learning_activity',
      label: sourceType,
      value: questionCount,
    });
  }

  trackPracticeSession(questionsAnswered: number, accuracy: number) {
    this.trackEvent({
      action: 'complete_practice',
      category: 'learning_activity',
      label: 'practice_session',
      value: questionsAnswered,
    });

    this.trackEvent({
      action: 'practice_accuracy',
      category: 'learning_performance',
      label: 'accuracy_rate',
      value: Math.round(accuracy),
    });
  }

  trackSpacedRepetition(quality: number, cardType: string) {
    this.trackEvent({
      action: 'spaced_repetition_review',
      category: 'learning_activity',
      label: cardType,
      value: quality,
    });
  }

  trackUserRetention(daysActive: number) {
    this.trackEvent({
      action: 'user_retention',
      category: 'user_behavior',
      label: 'days_active',
      value: daysActive,
    });
  }

  trackFeatureUsage(feature: string, action: string) {
    this.trackEvent({
      action: action,
      category: 'feature_usage',
      label: feature,
    });
  }

  // Track errors
  trackError(error: string, component?: string) {
    this.trackEvent({
      action: 'error_occurred',
      category: 'errors',
      label: component || 'unknown',
    });
  }
}

export const analytics = new AnalyticsService();
