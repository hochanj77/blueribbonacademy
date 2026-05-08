import { useState } from 'react';
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
import { Loader2, Save, Globe, CheckCircle, Info, Upload, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface SiteContentRow {
  id: string;
  page: string;
  section_key: string;
  content: Record<string, string>;
  updated_at: string | null;
}

type FieldDef = { label: string; key: string; type: 'text' | 'textarea' | 'url' | 'image'; hint?: string; defaultValue?: string };
type SectionDef = { label: string; description?: string; fields: FieldDef[] };

const contentSchema: Record<string, {
  label: string;
  sections: Record<string, SectionDef>;
}> = {
  home: {
    label: 'Homepage',
    sections: {
      hero: {
        label: 'Hero Banner',
        description: 'The main banner visitors see when they land on the homepage.',
        fields: [
          { label: 'Hero Background Image', key: 'hero_image', type: 'image', hint: 'Recommended: 1920x1080 or larger' },
          { label: 'Headline', key: 'headline', type: 'text', defaultValue: 'Where Every Student Can Shine.' },
          { label: 'Subheading', key: 'subheading', type: 'textarea', defaultValue: 'We believe all students have the right to receive a good education. With over 20 years of experience, we strive to help students develop character alongside academic prowess every step of the way.' },
          { label: 'Primary Button Text', key: 'cta_primary_text', type: 'text', defaultValue: 'Get Started' },
          { label: 'Primary Button Link', key: 'cta_primary_link', type: 'url', defaultValue: '/contact' },
          { label: 'Secondary Button Text', key: 'cta_secondary_text', type: 'text', defaultValue: 'Download Course Catalog' },
          { label: 'Secondary Button Link', key: 'cta_secondary_link', type: 'url', defaultValue: '/catalog' },
        ],
      },
    },
  },
  global: {
    label: 'Contact & Social',
    sections: {
      contact_info: {
        label: 'Contact Information',
        description: 'Shown on the Contact page, Footer, and anywhere contact info appears.',
        fields: [
          { label: 'Address Line 1', key: 'address_line1', type: 'text', defaultValue: '41 Union Ave FL2' },
          { label: 'Address Line 2', key: 'address_line2', type: 'text', defaultValue: 'Cresskill, NJ 07626' },
          { label: 'Phone Number', key: 'phone', type: 'text', defaultValue: '+1.201.406.3929' },
          { label: 'Email Address', key: 'email', type: 'text', defaultValue: 'info@blueribbon-nj.com' },
          { label: 'Weekday Hours', key: 'hours_weekday', type: 'text', defaultValue: 'Mon-Fri: 3:30pm - 9:00pm' },
          { label: 'Weekend Hours', key: 'hours_weekend', type: 'text', defaultValue: 'Sat: 9:00am - 4:00pm' },
        ],
      },
      social_links: {
        label: 'Social Media',
        description: 'Links shown on the Social page and Footer.',
        fields: [
          { label: 'Instagram Handle', key: 'instagram_handle', type: 'text', defaultValue: '@blueribbonacademy' },
          { label: 'Instagram URL', key: 'instagram_url', type: 'url' },
          { label: 'Google Business Name', key: 'google_business_name', type: 'text', defaultValue: 'Blue Ribbon Academy' },
          { label: 'Google Business URL', key: 'google_business_url', type: 'url' },
        ],
      },
    },
  },
};

const SiteContentTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('home');

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

  const pageKeys = Object.keys(contentSchema);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Website Content Editor</CardTitle>
            <CardDescription>Edit your site content. Changes take effect immediately.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            {pageKeys.map((page) => (
              <TabsTrigger key={page} value={page}>
                {contentSchema[page].label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="catalog">Course Catalog</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
          </TabsList>

          {pageKeys.map((page) => (
            <TabsContent key={page} value={page} className="space-y-6">
              {Object.entries(contentSchema[page].sections).map(([sectionKey, section]) => (
                <SectionEditor
                  key={`${page}-${sectionKey}`}
                  page={page}
                  sectionKey={sectionKey}
                  section={section}
                  existingContent={contentByPage[page]?.[sectionKey]}
                  userId={user?.id}
                  queryClient={queryClient}
                />
              ))}
            </TabsContent>
          ))}
          <TabsContent value="catalog">
            <ResourcesTab
              catalogContent={contentByPage['global']?.['catalog']
                ? { id: contentByPage['global']['catalog'].id, content: contentByPage['global']['catalog'].content }
                : null}
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

interface SectionConfig {
  label: string;
  description?: string;
  fields: FieldDef[];
}

interface SectionEditorProps {
  page: string;
  sectionKey: string;
  section: SectionConfig;
  existingContent?: SiteContentRow;
  userId?: string;
  queryClient: ReturnType<typeof useQueryClient>;
}

const SectionEditor = ({ page, sectionKey, section, existingContent, userId, queryClient }: SectionEditorProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    section.fields.forEach((f) => {
      initial[f.key] = existingContent?.content?.[f.key] || f.defaultValue || '';
    });
    return initial;
  });
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);

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
      toast.success(`${section.label} saved`);
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

  const handleImageUpload = async (key: string, file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `site-images/${page}-${sectionKey}-${key}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from('catalog')
        .getPublicUrl(filePath);
      updateField(key, publicUrl);
      toast.success('Image uploaded — click Save Changes to apply');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{section.label}</CardTitle>
        {section.description && (
          <CardDescription className="flex items-start gap-1.5 text-xs mt-1">
            <Info className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            {section.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {section.fields.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <Label htmlFor={`${page}-${sectionKey}-${field.key}`} className="text-sm font-medium">
              {field.label}
            </Label>
            {field.type === 'image' ? (
              <div className="space-y-2">
                {formData[field.key] && (
                  <div className="relative w-full h-32 rounded-lg overflow-hidden border">
                    <img src={formData[field.key]} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={uploading}
                    onClick={() => document.getElementById(`upload-${page}-${sectionKey}-${field.key}`)?.click()}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'Uploading...' : formData[field.key] ? 'Replace Image' : 'Upload Image'}
                  </Button>
                  {!formData[field.key] && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5" />
                      {field.hint || 'Upload an image'}
                    </span>
                  )}
                </div>
                <input
                  id={`upload-${page}-${sectionKey}-${field.key}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(field.key, file);
                    e.target.value = '';
                  }}
                />
              </div>
            ) : field.type === 'textarea' ? (
              <Textarea
                id={`${page}-${sectionKey}-${field.key}`}
                value={formData[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={3}
                className="resize-y"
                placeholder={field.hint || ''}
              />
            ) : (
              <Input
                id={`${page}-${sectionKey}-${field.key}`}
                type="text"
                value={formData[field.key] || ''}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.hint || (field.type === 'url' ? 'https://... or /page-path' : '')}
              />
            )}
          </div>
        ))}
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

export default SiteContentTab;
