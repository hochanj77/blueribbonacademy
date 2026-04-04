import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Eye, UserPlus, Mail, MousePointer } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';

interface DailyStat {
  date: string;
  count: number;
}

function StatCard({ title, value, icon: Icon, subtitle }: {
  title: string;
  value: number;
  icon: React.ElementType;
  subtitle?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function SimpleBarChart({ data, label }: { data: DailyStat[]; label: string }) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">{label} (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {data.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
              <div className="absolute -top-6 hidden group-hover:block text-xs bg-foreground text-background px-1.5 py-0.5 rounded whitespace-nowrap">
                {format(new Date(d.date), 'MMM d')}: {d.count}
              </div>
              <div
                className="w-full bg-primary/80 rounded-t transition-all hover:bg-primary"
                style={{ height: `${(d.count / max) * 100}%`, minHeight: d.count > 0 ? '2px' : '0' }}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{format(new Date(data[0]?.date || new Date()), 'MMM d')}</span>
          <span>{format(new Date(data[data.length - 1]?.date || new Date()), 'MMM d')}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TopPagesTable({ pages }: { pages: { page: string; count: number }[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Pages (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <p className="text-sm text-muted-foreground">No data yet</p>
        ) : (
          <div className="space-y-2">
            {pages.map((p) => (
              <div key={p.page} className="flex items-center justify-between text-sm">
                <span className="font-mono text-muted-foreground truncate mr-4">{p.page}</span>
                <span className="font-medium whitespace-nowrap">{p.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AnalyticsDashboard() {
  const thirtyDaysAgo = startOfDay(subDays(new Date(), 30)).toISOString();
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7)).toISOString();

  // Summary stats (last 7 days)
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type')
        .gte('created_at', sevenDaysAgo);
      if (error) throw error;

      const counts = { page_view: 0, signup: 0, contact_submit: 0, contact_click: 0, login: 0 };
      for (const row of data || []) {
        const key = row.event_type as keyof typeof counts;
        if (key in counts) counts[key]++;
      }
      return counts;
    },
  });

  // Daily page views (last 30 days)
  const { data: dailyViews = [] } = useQuery({
    queryKey: ['analytics-daily-views'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('created_at')
        .eq('event_type', 'page_view')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;

      const buckets: Record<string, number> = {};
      for (let i = 30; i >= 0; i--) {
        buckets[format(subDays(new Date(), i), 'yyyy-MM-dd')] = 0;
      }
      for (const row of data || []) {
        const day = format(new Date(row.created_at), 'yyyy-MM-dd');
        if (day in buckets) buckets[day]++;
      }
      return Object.entries(buckets).map(([date, count]) => ({ date, count }));
    },
  });

  // Top pages (last 30 days)
  const { data: topPages = [] } = useQuery({
    queryKey: ['analytics-top-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('page')
        .eq('event_type', 'page_view')
        .gte('created_at', thirtyDaysAgo);
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        counts[row.page] = (counts[row.page] || 0) + 1;
      }
      return Object.entries(counts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  // Contact submissions count (from contact_submissions table)
  const { data: contactCount = 0 } = useQuery({
    queryKey: ['analytics-contacts'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contact_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo);
      if (error) throw error;
      return count || 0;
    },
  });

  // Student sign-ups (last 7 days)
  const { data: signupCount = 0 } = useQuery({
    queryKey: ['analytics-signups'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('created_at', sevenDaysAgo);
      if (error) throw error;
      return count || 0;
    },
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Page Views"
          value={stats?.page_view || 0}
          icon={Eye}
          subtitle="Last 7 days"
        />
        <StatCard
          title="Sign Ups"
          value={signupCount}
          icon={UserPlus}
          subtitle="Last 7 days"
        />
        <StatCard
          title="Contact Forms"
          value={contactCount}
          icon={Mail}
          subtitle="Last 7 days"
        />
        <StatCard
          title="Contact Clicks"
          value={stats?.contact_click || 0}
          icon={MousePointer}
          subtitle="Last 7 days"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <SimpleBarChart data={dailyViews} label="Page Views" />
        <TopPagesTable pages={topPages} />
      </div>
    </div>
  );
}
