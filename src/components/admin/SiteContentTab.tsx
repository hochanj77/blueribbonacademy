import { useState, useRef, useCallback } from 'react';
import AnnouncementsTab from './AnnouncementsTab';
import ResourcesTab from './ResourcesTab';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Loader2, Save, Globe, CheckCircle, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface SiteContentRow {
  id: string;
  page: string;
  section_key: string;
  content: Record<string, string>;
  updated_at: string | null;
}

const contentSchema: Record<string, Record<string, { label: string; type: 'text' | 'textarea' | 'url' }[]>> = {
  home: {
    hero: [
      { label: 'Headline', type: 'text' },
      { label: 'Subheading', type: 'textarea' },
      { label: 'CTA Primary Text', type: 'text' },
      { label: 'CTA Secondary Text', type: 'text' },
    ],
    cta_section: [
      { label: 'Headline', type: 'text' },
      { label: 'Subheading', type: 'textarea' },
      { label: 'Button Text', type: 'text' },
    ],
  },
  courses: {
    hero: [
      { label: 'Headline', type: 'text' },
      { label: 'Subheading', type: 'textarea' },
    ],
    cta: [
      { label: 'Text', type: 'textarea' },
      { label: 'Button Text', type: 'text' },
    ],
  },
  about: {
    welcome: [
      { label: 'Headline', type: 'text' },
      { label: 'Intro', type: 'text' },
      { label: 'Body', type: 'textarea' },
    ],
    belonging: [
      { label: 'Headline', type: 'text' },
      { label: 'Body', type: 'textarea' },
    ],
    heart: [
      { label: 'Headline', type: 'text' },
      { label: 'Body', type: 'textarea' },
      { label: 'Values Intro', type: 'text' },
    ],
    excellence: [
      { label: 'Headline', type: 'text' },
      { label: 'Body', type: 'textarea' },
      { label: 'Quote', type: 'textarea' },
    ],
  },
  global: {
    contact_info: [
      { label: 'Address Line1', type: 'text' },
      { label: 'Address Line2', type: 'text' },
      { label: 'Phone', type: 'text' },
      { label: 'Email', type: 'text' },
      { label: 'Hours Weekday', type: 'text' },
      { label: 'Hours Weekend', type: 'text' },
    ],
    social_links: [
      { label: 'Instagram Handle', type: 'text' },
      { label: 'Google Business Name', type: 'text' },
    ],
    catalog: [
      { label: 'Catalog Description', type: 'textarea' },
    ],
  },
};

function labelToKey(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '_');
}

const pageLabels: Record<string, string> = {
  home: 'Homepage',
  courses: 'Programs',
  about: 'About Us',
  global: 'Global Settings',
};

const sectionLabels: Record<string, string> = {
  hero: 'Hero Section',
  cta_section: 'CTA Section',
  cta: 'Call to Action',
  welcome: 'Welcome Section',
  belonging: 'Power of Belonging',
  heart: 'Heart Behind Knowledge',
  excellence: 'Built for Excellence',
  contact_info: 'Contact Information',
  social_links: 'Social Media Links',
  catalog: 'Course Catalog',
  programs_list: 'Programs List',
};

const SiteContentTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('global');

  const { data: allContent = [], isLoading } = useQuery({
    queryKey: ['site_content_admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .order('page')
        .order('section_key');
      if (error) throw error;
      return data as SiteContentRow[];
    },
  });

  const contentByPage: Record<string, Record<string, SiteContentRow>> = {};
  allContent.forEach((row) => {
    if (!contentByPage[row.page]) contentByPage[row.page] = {};
    contentByPage[row.page][row.section_key] = row;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Website Content Editor</CardTitle>
            <CardDescription>
              Edit text, contact info, and social media across your site. Changes take effect immediately.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            {Object.keys(contentSchema).map((page) => (
              <TabsTrigger key={page} value={page}>
                {pageLabels[page] || page}
              </TabsTrigger>
            ))}
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          {Object.entries(contentSchema).map(([page, sections]) => (
            <TabsContent key={page} value={page} className="space-y-6">
              {page === 'courses' && (
                <ProgramsListEditor
                  existingContent={contentByPage['courses']?.['programs_list']}
                  userId={user?.id}
                  queryClient={queryClient}
                />
              )}
              {Object.entries(sections).map(([sectionKey, fields]) => (
                <SectionEditor
                  key={`${page}-${sectionKey}`}
                  page={page}
                  sectionKey={sectionKey}
                  fields={fields}
                  existingContent={contentByPage[page]?.[sectionKey]}
                  userId={user?.id}
                  queryClient={queryClient}
                />
              ))}
            </TabsContent>
          ))}
          <TabsContent value="resources">
            <ResourcesTab
              catalogContent={contentByPage['global']?.['catalog'] ? {
                id: allContent.find(r => r.page === 'global' && r.section_key === 'catalog')?.id || '',
                content: contentByPage['global']['catalog'] as unknown as Record<string, string>,
              } : null}
              userId={user?.id}
            />
          </TabsContent>
          <TabsContent value="announcements">
            <AnnouncementsTab />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface SectionEditorProps {
  page: string;
  sectionKey: string;
  fields: { label: string; type: 'text' | 'textarea' | 'url' }[];
  existingContent?: SiteContentRow;
  userId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
}

const SectionEditor = ({ page, sectionKey, fields, existingContent, userId, queryClient }: SectionEditorProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      const key = labelToKey(f.label);
      initial[key] = existingContent?.content?.[key] || '';
    });
    return initial;
  });
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (content: Record<string, string>) => {
      if (existingContent) {
        const { error } = await supabase
          .from('site_content')
          .update({ content, updated_by: userId || null })
          .eq('id', existingContent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({ page, section_key: sectionKey, content, updated_by: userId || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      toast.success(`${sectionLabels[sectionKey] || sectionKey} saved`);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error('Failed to save content'),
  });

  const handleSave = () => saveMutation.mutate(formData);

  const updateField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{sectionLabels[sectionKey] || sectionKey}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => {
          const key = labelToKey(field.label);
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`${page}-${sectionKey}-${key}`} className="text-sm font-medium">
                {field.label}
              </Label>
              {field.type === 'textarea' ? (
                <Textarea
                  id={`${page}-${sectionKey}-${key}`}
                  value={formData[key] || ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  rows={3}
                  className="resize-y"
                />
              ) : (
                <Input
                  id={`${page}-${sectionKey}-${key}`}
                  type="text"
                  value={formData[key] || ''}
                  onChange={(e) => updateField(key, e.target.value)}
                  placeholder={field.type === 'url' ? '/path or https://...' : ''}
                />
              )}
            </div>
          );
        })}
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
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
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const DEFAULT_PROGRAMS = ['SAT Prep', 'ACT Prep', 'BCA Prep', 'Columbia SHP', 'Math Contests', 'Writing Contests', 'Science Contest', 'Private Lessons'];

interface ProgramsListEditorProps {
  existingContent?: SiteContentRow;
  userId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
}

const ProgramsListEditor = ({ existingContent, userId, queryClient }: ProgramsListEditorProps) => {
  const [programs, setPrograms] = useState<string[]>(() => {
    const stored = existingContent?.content?.['programs'];
    if (stored) {
      try {
        const parsed = JSON.parse(stored as string);
        if (Array.isArray(parsed)) return parsed;
      } catch { /* fall through */ }
    }
    return DEFAULT_PROGRAMS;
  });
  const [newProgram, setNewProgram] = useState('');
  const [saved, setSaved] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (list: string[]) => {
      const content = { programs: JSON.stringify(list) };
      if (existingContent) {
        const { error } = await supabase
          .from('site_content')
          .update({ content, updated_by: userId || null })
          .eq('id', existingContent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({ page: 'courses', section_key: 'programs_list', content, updated_by: userId || null });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      toast.success('Programs list saved');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: () => toast.error('Failed to save programs list'),
  });

  const addProgram = () => {
    const trimmed = newProgram.trim();
    if (!trimmed || programs.includes(trimmed)) return;
    setPrograms(prev => [...prev, trimmed]);
    setNewProgram('');
    setSaved(false);
  };

  const removeProgram = (index: number) => {
    setPrograms(prev => prev.filter((_, i) => i !== index));
    setSaved(false);
  };

  const moveProgram = (index: number, direction: -1 | 1) => {
    setPrograms(prev => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    setSaved(false);
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Programs List</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {programs.map((program, index) => (
            <div key={index} className="flex items-center gap-2 p-2 rounded-md bg-muted">
              <div className="flex flex-col">
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs leading-none disabled:opacity-30"
                  onClick={() => moveProgram(index, -1)}
                  disabled={index === 0}
                >▲</button>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground text-xs leading-none disabled:opacity-30"
                  onClick={() => moveProgram(index, 1)}
                  disabled={index === programs.length - 1}
                >▼</button>
              </div>
              <span className="flex-1 text-sm">{program}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => removeProgram(index)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newProgram}
            onChange={(e) => setNewProgram(e.target.value)}
            placeholder="New program name"
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
          />
          <Button variant="outline" size="sm" onClick={addProgram} className="gap-1 shrink-0">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            onClick={() => saveMutation.mutate(programs)}
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
            {saved ? 'Saved' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteContentTab;
