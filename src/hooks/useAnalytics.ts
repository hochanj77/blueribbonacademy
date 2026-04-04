import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

type EventType = 'page_view' | 'contact_submit' | 'contact_click' | 'signup' | 'login';

interface TrackOptions {
  page?: string;
  metadata?: Record<string, string>;
}

function getVisitorId(): string {
  const key = 'bra_visitor_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getReferrerSource(): string {
  const ref = document.referrer;
  if (!ref) return 'direct';
  try {
    const hostname = new URL(ref).hostname;
    if (hostname.includes('google')) return 'google';
    if (hostname.includes('bing')) return 'bing';
    if (hostname.includes('instagram') || hostname.includes('ig.')) return 'instagram';
    if (hostname.includes('facebook') || hostname.includes('fb.')) return 'facebook';
    if (hostname.includes('twitter') || hostname.includes('t.co')) return 'twitter';
    if (hostname.includes('linkedin')) return 'linkedin';
    if (hostname.includes('blueribbon-nj')) return 'internal';
    return hostname;
  } catch {
    return 'other';
  }
}

export function useAnalytics() {
  const track = useCallback(async (event_type: EventType, options?: TrackOptions) => {
    try {
      const source = getReferrerSource();
      await supabase.from('analytics_events').insert({
        event_type,
        page: options?.page || window.location.pathname,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        metadata: {
          ...options?.metadata,
          visitor_id: getVisitorId(),
          device: getDeviceType(),
          source: source === 'internal' ? 'direct' : source,
        },
      });
    } catch {
      // Silently fail — analytics should never break the app
    }
  }, []);

  return { track };
}
