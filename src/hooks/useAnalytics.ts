import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType = 'page_view' | 'contact_submit' | 'contact_click' | 'signup' | 'login';

interface TrackOptions {
  page?: string;
  metadata?: Record<string, string>;
}

export function useAnalytics() {
  const track = useCallback(async (event_type: EventType, options?: TrackOptions) => {
    try {
      await supabase.from('analytics_events').insert({
        event_type,
        page: options?.page || window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        metadata: options?.metadata || null,
      });
    } catch {
      // Silently fail — analytics should never break the app
    }
  }, []);

  return { track };
}
