import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, Users, Mail, TrendingUp, TrendingDown, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { format, subDays, startOfDay, startOfToday, startOfYesterday, endOfYesterday } from 'date-fns';

interface AnalyticsEvent {
  event_type: string;
  page: string;
  referrer: string | null;
  user_agent: string | null;
  metadata: Record<string, string> | null;
  created_at: string;
}

function PercentBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  const pct = previous === 0 ? 100 : Math.round(((current - previous) / previous) * 100);
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isUp ? '+' : ''}{pct}%
    </span>
  );
}

function StatCard({ title, value, prevValue, icon: Icon, today, yesterday }: {
  title: string;
  value: number;
  prevValue: number;
  icon: React.ElementType;
  today: number;
  yesterday: number;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">{title}</span>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-bold">{value.toLocaleString()}</span>
          <PercentBadge current={value} previous={prevValue} />
        </div>
        <p className="text-xs text-muted-foreground">
          {today} today &middot; {yesterday} yesterday
        </p>
      </CardContent>
    </Card>
  );
}

function SessionsChart({ data }: { data: { date: string; sessions: number; visitors: number }[] }) {
  const maxVal = Math.max(...data.map(d => Math.max(d.sessions, d.visitors)), 1);
  const hasData = data.some(d => d.sessions > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sessions Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
            No session data yet — chart will populate as visitors arrive
          </div>
        ) : (
          <div className="flex items-end gap-[2px] h-40">
            {data.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5 group relative">
                <div className="absolute -top-8 hidden group-hover:block text-xs bg-foreground text-background px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                  {format(new Date(d.date), 'MMM d')}: {d.sessions} sessions, {d.visitors} unique
                </div>
                <div
                  className="w-full bg-primary/20 rounded-t relative overflow-hidden transition-all hover:bg-primary/30"
                  style={{ height: `${Math.max((d.sessions / maxVal) * 100, d.sessions > 0 ? 8 : 0)}%` }}
                >
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary/70 rounded-t"
                    style={{ height: `${d.visitors > 0 ? (d.visitors / d.sessions) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{data.length > 0 ? format(new Date(data[0].date), 'MMM d') : ''}</span>
          <span>{data.length > 0 ? format(new Date(data[data.length - 1].date), 'MMM d') : ''}</span>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-primary/20 rounded" /> Sessions
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 bg-primary/70 rounded" /> Unique Visitors
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function TrafficSourcesCard({ sources }: { sources: { source: string; count: number }[] }) {
  const max = Math.max(...sources.map(s => s.count), 1);
  const labels: Record<string, string> = {
    direct: 'Direct',
    google: 'Google (Organic)',
    bing: 'Bing (Organic)',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter / X',
    linkedin: 'LinkedIn',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Traffic Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {sources.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-3">
            {sources.map((s) => (
              <div key={s.source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {labels[s.source] || s.source}
                  </span>
                  <span className="font-medium">{s.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(s.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceBreakdownCard({ devices }: { devices: { device: string; count: number }[] }) {
  const total = devices.reduce((sum, d) => sum + d.count, 0) || 1;
  const icons: Record<string, React.ElementType> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet };
  const colors: Record<string, string> = { desktop: 'bg-blue-500', mobile: 'bg-green-500', tablet: 'bg-purple-500' };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Sessions by Device</CardTitle>
      </CardHeader>
      <CardContent>
        {devices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <>
            <div className="flex h-3 rounded-full overflow-hidden mb-4">
              {devices.map((d) => (
                <div
                  key={d.device}
                  className={`${colors[d.device] || 'bg-gray-400'}`}
                  style={{ width: `${(d.count / total) * 100}%` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {devices.map((d) => {
                const Icon = icons[d.device] || Monitor;
                const pct = Math.round((d.count / total) * 100);
                return (
                  <div key={d.device} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors[d.device] || 'bg-gray-400'}`} />
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="capitalize">{d.device}</span>
                    </span>
                    <span className="text-muted-foreground">{pct}% &middot; {d.count}</span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function TopPagesCard({ pages }: { pages: { page: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Top Pages</CardTitle>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-2">
            {pages.map((p, i) => (
              <div key={p.page} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="font-mono text-muted-foreground truncate max-w-[200px]">{p.page}</span>
                </span>
                <span className="font-medium">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const now = new Date();
  const thirtyDaysAgo = startOfDay(subDays(now, 30)).toISOString();
  const sixtyDaysAgo = startOfDay(subDays(now, 60)).toISOString();
  const todayStart = startOfToday().toISOString();
  const yesterdayStart = startOfYesterday().toISOString();
  const yesterdayEnd = endOfYesterday().toISOString();

  const { data: allEvents = [], isLoading } = useQuery<AnalyticsEvent[]>({
    queryKey: ['analytics-all-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events' as any)
        .select('event_type, page, referrer, user_agent, metadata, created_at')
        .gte('created_at', sixtyDaysAgo);
      if (error) throw error;
      return (data || []) as AnalyticsEvent[];
    },
  });

  const { data: contactCount = 0 } = useQuery({
    queryKey: ['analytics-contacts-30d'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: prevContactCount = 0 } = useQuery({
    queryKey: ['analytics-contacts-prev'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo)
        .lt('created_at', thirtyDaysAgo);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: contactToday = 0 } = useQuery({
    queryKey: ['analytics-contacts-today'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart);
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: contactYesterday = 0 } = useQuery({
    queryKey: ['analytics-contacts-yesterday'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterdayStart)
        .lt('created_at', todayStart);
      if (error) throw error;
      return count || 0;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // Split into current 30d and previous 30d
  const current30d = allEvents.filter(e => e.created_at >= thirtyDaysAgo);
  const prev30d = allEvents.filter(e => e.created_at >= sixtyDaysAgo && e.created_at < thirtyDaysAgo);
  const todayEvents = current30d.filter(e => e.created_at >= todayStart);
  const yesterdayEvents = current30d.filter(e => e.created_at >= yesterdayStart && e.created_at < todayStart);

  const pageViews = current30d.filter(e => e.event_type === 'page_view');
  const prevPageViews = prev30d.filter(e => e.event_type === 'page_view');

  // Unique visitors by visitor_id in metadata
  const getUniqueVisitors = (events: AnalyticsEvent[]) => {
    const ids = new Set<string>();
    events.filter(e => e.event_type === 'page_view').forEach(e => {
      const vid = e.metadata?.visitor_id;
      if (vid) ids.add(vid);
      else ids.add(e.user_agent || Math.random().toString());
    });
    return ids.size;
  };

  const uniqueVisitors = getUniqueVisitors(current30d);
  const prevUniqueVisitors = getUniqueVisitors(prev30d);
  const uniqueToday = getUniqueVisitors(todayEvents);
  const uniqueYesterday = getUniqueVisitors(yesterdayEvents);

  const sessions = pageViews.length;
  const prevSessions = prevPageViews.length;
  const sessionsToday = todayEvents.filter(e => e.event_type === 'page_view').length;
  const sessionsYesterday = yesterdayEvents.filter(e => e.event_type === 'page_view').length;

  // Daily chart data
  const dailyData: { date: string; sessions: number; visitors: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = format(subDays(now, i), 'yyyy-MM-dd');
    const dayEvents = current30d.filter(e => e.event_type === 'page_view' && format(new Date(e.created_at), 'yyyy-MM-dd') === date);
    const dayVisitors = new Set(dayEvents.map(e => e.metadata?.visitor_id || e.user_agent || ''));
    dailyData.push({ date, sessions: dayEvents.length, visitors: dayVisitors.size });
  }

  // Traffic sources
  const sourceCounts: Record<string, number> = {};
  pageViews.forEach(e => {
    const src = e.metadata?.source || 'direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  });
  const sources = Object.entries(sourceCounts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  // Device breakdown
  const deviceCounts: Record<string, number> = {};
  pageViews.forEach(e => {
    const device = e.metadata?.device || 'desktop';
    deviceCounts[device] = (deviceCounts[device] || 0) + 1;
  });
  const devices = Object.entries(deviceCounts)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  // Top pages
  const pageCounts: Record<string, number> = {};
  pageViews.forEach(e => {
    const p = e.page.toLowerCase();
    pageCounts[p] = (pageCounts[p] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .map(([page, count]) => ({ page, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Site Sessions"
          value={sessions}
          prevValue={prevSessions}
          icon={Eye}
          today={sessionsToday}
          yesterday={sessionsYesterday}
        />
        <StatCard
          title="Unique Visitors"
          value={uniqueVisitors}
          prevValue={prevUniqueVisitors}
          icon={Users}
          today={uniqueToday}
          yesterday={uniqueYesterday}
        />
        <StatCard
          title="Contact Forms"
          value={contactCount}
          prevValue={prevContactCount}
          icon={Mail}
          today={contactToday}
          yesterday={contactYesterday}
        />
      </div>

      {/* Sessions Chart + Traffic Sources */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <SessionsChart data={dailyData} />
        </div>
        <TrafficSourcesCard sources={sources} />
      </div>

      {/* Device + Top Pages */}
      <div className="grid md:grid-cols-3 gap-6">
        <DeviceBreakdownCard devices={devices} />
        <div className="md:col-span-2">
          <TopPagesCard pages={topPages} />
        </div>
      </div>
    </div>
  );
}
