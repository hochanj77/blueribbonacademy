import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Plus, Trash2, CheckCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';

interface ClassEntry {
  subject: string;
  day: string;
  time: string;
  details: string;
}

interface ScheduleGroup {
  campus: string;
  category: string;
  entries: ClassEntry[];
}

const defaultGroups: ScheduleGroup[] = [
  {
    campus: 'Cresskill',
    category: 'Digital SAT Prep',
    entries: [
      { subject: 'Digital SAT Test Prep', day: 'Sat', time: '9:00 am - 3:30 pm', details: '9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break' },
      { subject: 'Digital SAT Lecture', day: 'Sat', time: '9:00 pm - 3:30 pm', details: '12:00 pm - 1:00 pm Lunch break' },
    ],
  },
  {
    campus: 'Cresskill',
    category: 'Math Analysis',
    entries: [
      { subject: 'Pre-Math Analysis', day: 'Tues', time: '4:30 pm - 6:00 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Math Analysis IA', day: 'Mon & Wed', time: '3:45 pm - 5:00 pm', details: 'Lecture 75 min, Test 30 min after' },
      { subject: 'Math Analysis IB', day: 'Mon', time: '6:15 pm - 7:30 pm', details: 'Lecture 75 min, Test 30 min before' },
      { subject: 'Math Analysis II', day: 'Mon & Wed', time: '4:15 pm - 5:30 pm', details: 'Lecture 75 min' },
      { subject: 'Math Analysis III', day: 'Mon', time: '3:45 pm - 5:15 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Math Analysis IV', day: 'Mon & Thur', time: '7:00 pm - 8:30 pm', details: 'Lecture 1.5 hrs' },
    ],
  },
  {
    campus: 'Cresskill',
    category: 'Literacy',
    entries: [
      { subject: 'Pre-Literacy', day: 'Tue', time: '3:45 pm - 5:15 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy I', day: 'Tue', time: '5:30 pm - 7:00 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy IIA', day: 'Thur', time: '6:15 pm - 7:45 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy IIB', day: 'Fri', time: '4:00 pm - 5:30 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy III', day: 'Thur', time: '3:45 pm - 5:15 pm', details: 'Lecture 75 min' },
    ],
  },
  {
    campus: 'Cresskill',
    category: 'Math (Core)',
    entries: [
      { subject: 'Algebra I', day: 'Sat', time: '9:30 am - 11:30 am', details: 'Lecture 2 hrs' },
      { subject: 'Algebra II', day: 'Wed', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Geometry', day: 'Mon', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Precalculus', day: 'Mon', time: '6:30 pm - 8:30 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Cresskill',
    category: 'AP & Science',
    entries: [
      { subject: 'AP Chemistry', day: 'Tue', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Physics', day: 'Thur', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Calculus', day: 'Tue', time: '6:30 pm - 9:00 pm', details: 'Lecture 2.5 hrs' },
      { subject: 'AP Biology', day: 'Tue', time: '6:00 pm - 8:30 pm', details: 'Lecture 2.5 hrs' },
      { subject: 'Biology', day: 'Mon', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Chemistry', day: 'Wed', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Fort Lee',
    category: 'Math',
    entries: [
      { subject: 'Geometry', day: 'n/a', time: 'n/a', details: 'n/a' },
      { subject: 'Algebra I', day: 'n/a', time: 'n/a', details: 'n/a' },
      { subject: 'Algebra II', day: 'Tues', time: '4:00 pm - 6:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'Precalculus (HL/SL I)', day: 'Wed', time: '6:00 pm - 8:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Calculus (HL/SL II)', day: 'Wed', time: '4:00 pm - 6:00 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Fort Lee',
    category: 'Digital SAT Prep',
    entries: [
      { subject: 'Digital SAT Test Prep', day: 'Sat', time: '9:00 am - 3:30 pm', details: '9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break' },
    ],
  },
];

const ScheduleContentEditor = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['site_content', 'schedule_data', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page', 'schedule_data')
        .eq('section_key', 'all')
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const [groups, setGroups] = useState<ScheduleGroup[]>(defaultGroups);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (existing?.content) {
      try {
        const content = existing.content as Record<string, string>;
        if (content.groups_json) {
          setGroups(JSON.parse(content.groups_json));
        }
      } catch {
        // keep defaults
      }
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const content = { groups_json: JSON.stringify(groups) };
      if (existing) {
        const { error } = await supabase
          .from('site_content')
          .update({ content, updated_by: user?.id || null })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({ page: 'schedule_data', section_key: 'all', content, updated_by: user?.id || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      toast.success('Schedule saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error('Failed to save schedule'),
  });

  const updateEntry = (groupIdx: number, entryIdx: number, field: keyof ClassEntry, value: string) => {
    setGroups(prev => {
      const next = structuredClone(prev);
      next[groupIdx].entries[entryIdx][field] = value;
      return next;
    });
    setSaved(false);
  };

  const addEntry = (groupIdx: number) => {
    setGroups(prev => {
      const next = structuredClone(prev);
      next[groupIdx].entries.push({ subject: '', day: '', time: '', details: '' });
      return next;
    });
    setSaved(false);
  };

  const removeEntry = (groupIdx: number, entryIdx: number) => {
    setGroups(prev => {
      const next = structuredClone(prev);
      next[groupIdx].entries.splice(entryIdx, 1);
      return next;
    });
    setSaved(false);
  };

  const addGroup = () => {
    setGroups(prev => [...prev, { campus: 'Cresskill', category: 'New Category', entries: [] }]);
    setSaved(false);
  };

  const removeGroup = (groupIdx: number) => {
    setGroups(prev => prev.filter((_, i) => i !== groupIdx));
    setSaved(false);
  };

  const updateGroupMeta = (groupIdx: number, field: 'campus' | 'category', value: string) => {
    setGroups(prev => {
      const next = structuredClone(prev);
      next[groupIdx][field] = value;
      return next;
    });
    setSaved(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const campuses = [...new Set(groups.map(g => g.campus))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Manage the class schedule displayed on the public Schedule page. Changes take effect immediately after saving.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={addGroup} className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            size="sm"
            variant={saved ? 'outline' : 'default'}
            className="gap-2"
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? 'Saved' : 'Save All Changes'}
          </Button>
        </div>
      </div>

      {campuses.map(campus => (
        <div key={campus} className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{campus} Campus</h3>
          </div>

          {groups
            .map((group, originalIdx) => ({ group, originalIdx }))
            .filter(({ group }) => group.campus === campus)
            .map(({ group, originalIdx }) => (
              <Card key={originalIdx} className="border-dashed">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="space-y-1 flex-1">
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <Label className="text-xs text-muted-foreground">Category Name</Label>
                            <Input
                              value={group.category}
                              onChange={e => updateGroupMeta(originalIdx, 'category', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                          <div className="w-40">
                            <Label className="text-xs text-muted-foreground">Campus</Label>
                            <Input
                              value={group.campus}
                              onChange={e => updateGroupMeta(originalIdx, 'campus', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive shrink-0 ml-2"
                      onClick={() => removeGroup(originalIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.entries.length > 0 && (
                    <div className="grid grid-cols-[1fr_100px_140px_1fr_32px] gap-2 text-xs font-medium text-muted-foreground px-1">
                      <span>Subject</span>
                      <span>Day</span>
                      <span>Time</span>
                      <span>Details</span>
                      <span />
                    </div>
                  )}
                  {group.entries.map((entry, entryIdx) => (
                    <div key={entryIdx} className="grid grid-cols-[1fr_100px_140px_1fr_32px] gap-2 items-center">
                      <Input
                        value={entry.subject}
                        onChange={e => updateEntry(originalIdx, entryIdx, 'subject', e.target.value)}
                        placeholder="Subject"
                        className="text-sm"
                      />
                      <Input
                        value={entry.day}
                        onChange={e => updateEntry(originalIdx, entryIdx, 'day', e.target.value)}
                        placeholder="Day"
                        className="text-sm"
                      />
                      <Input
                        value={entry.time}
                        onChange={e => updateEntry(originalIdx, entryIdx, 'time', e.target.value)}
                        placeholder="Time"
                        className="text-sm"
                      />
                      <Input
                        value={entry.details}
                        onChange={e => updateEntry(originalIdx, entryIdx, 'details', e.target.value)}
                        placeholder="Details"
                        className="text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeEntry(originalIdx, entryIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addEntry(originalIdx)}
                    className="gap-1.5 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Class
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      ))}
    </div>
  );
};

export default ScheduleContentEditor;
