import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Trash2, FileText, File, Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface Resource {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
}

// ── Catalog Uploader (moved from SiteContentTab) ──────────────────────

interface CatalogUploaderProps {
  existingContent?: { id: string; content: Record<string, string> } | null;
  userId?: string;
}

const CatalogUploader = ({ existingContent, userId }: CatalogUploaderProps) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const catalogUrl = existingContent?.content?.['catalog_url'] || '';
  const fileName = catalogUrl ? catalogUrl.split('/').pop() : '';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file');
      return;
    }

    setUploading(true);
    try {
      const filePath = 'course-catalog.pdf';
      await supabase.storage.from('catalog').remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from('catalog')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/catalog/${filePath}`;
      const newContent = { ...(existingContent?.content || {}), catalog_url: publicUrl };

      if (existingContent) {
        const { error } = await supabase
          .from('site_content')
          .update({ content: newContent, updated_by: userId || null })
          .eq('id', existingContent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('site_content')
          .insert({ page: 'global', section_key: 'catalog', content: newContent, updated_by: userId || null });
        if (error) throw error;
      }

      queryClient.invalidateQueries({ queryKey: ['site_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      toast.success('Catalog PDF uploaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload catalog');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      await supabase.storage.from('catalog').remove(['course-catalog.pdf']);
      const newContent = { ...(existingContent?.content || {}) };
      delete (newContent as Record<string, string>)['catalog_url'];
      if (existingContent) {
        await supabase
          .from('site_content')
          .update({ content: newContent, updated_by: userId || null })
          .eq('id', existingContent.id);
      }
      queryClient.invalidateQueries({ queryKey: ['site_content_admin'] });
      queryClient.invalidateQueries({ queryKey: ['site_content'] });
      toast.success('Catalog PDF removed');
    } catch {
      toast.error('Failed to remove catalog');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Course Catalog PDF</CardTitle>
        <CardDescription>Upload the course catalog PDF available on the Programs page and Student Dashboard.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {catalogUrl ? (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <a href={catalogUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate flex-1">
              {fileName}
            </a>
            <Button variant="ghost" size="icon" onClick={handleRemove} disabled={uploading}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No catalog PDF uploaded yet.</p>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {catalogUrl ? 'Replace PDF' : 'Upload PDF'}
        </Button>
      </CardContent>
    </Card>
  );
};

// ── General Resource Uploader ──────────────────────────────────────────

const ResourceUploadForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !selectedFile) {
      toast.error('Please provide a title and select a file');
      return;
    }

    setUploading(true);
    try {
      const timestamp = Date.now();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${timestamp}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(filePath, selectedFile, { upsert: true });
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('resources').insert({
        title: title.trim(),
        description: description.trim() || null,
        file_path: filePath,
        file_name: selectedFile.name,
        file_type: selectedFile.type || null,
        file_size: selectedFile.size,
        uploaded_by: user?.id || null,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['admin_resources'] });
      queryClient.invalidateQueries({ queryKey: ['student_resources'] });
      toast.success('Resource uploaded successfully');
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error(err);
      toast.error('Failed to upload resource');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Plus className="h-4 w-4" /> Upload New Resource
        </CardTitle>
        <CardDescription>Upload documents, worksheets, or other files for students to access.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="resource-title">Title *</Label>
          <Input
            id="resource-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. SAT Practice Test #3"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="resource-desc">Description</Label>
          <Textarea
            id="resource-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={2}
          />
        </div>
        <div className="space-y-1.5">
          <Label>File *</Label>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
          />
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" /> Choose File
            </Button>
            {selectedFile && (
              <span className="text-sm text-muted-foreground truncate">{selectedFile.name}</span>
            )}
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button onClick={handleSubmit} disabled={uploading || !title.trim() || !selectedFile} size="sm" className="gap-2">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Upload Resource
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ── Resources List ─────────────────────────────────────────────────────

const ResourcesList = () => {
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['admin_resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Resource[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (resource: Resource) => {
      await supabase.storage.from('resources').remove([resource.file_path]);
      const { error } = await supabase.from('resources').delete().eq('id', resource.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_resources'] });
      queryClient.invalidateQueries({ queryKey: ['student_resources'] });
      toast.success('Resource deleted');
    },
    onError: () => toast.error('Failed to delete resource'),
  });

  const getFileUrl = (filePath: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/resources/${filePath}`;

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (type: string | null) => {
    if (type?.includes('pdf')) return <FileText className="h-5 w-5 text-destructive/70" />;
    return <File className="h-5 w-5 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-40" />
        <p>No resources uploaded yet. Use the form above to add resources.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Uploaded Resources ({resources.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {resources.map((r) => (
          <div key={r.id} className="flex items-center gap-3 p-3 rounded-md bg-muted">
            {getFileIcon(r.file_type)}
            <div className="flex-1 min-w-0">
              <a
                href={getFileUrl(r.file_path)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary underline truncate block"
              >
                {r.title}
              </a>
              {r.description && (
                <p className="text-xs text-muted-foreground truncate">{r.description}</p>
              )}
              <p className="text-xs text-muted-foreground/60">
                {r.file_name} {r.file_size ? `· ${formatSize(r.file_size)}` : ''} · {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate(r)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

// ── Main Resources Tab ─────────────────────────────────────────────────

interface ResourcesTabProps {
  catalogContent?: { id: string; content: Record<string, string> } | null;
  userId?: string;
}

const ResourcesTab = ({ catalogContent, userId }: ResourcesTabProps) => {
  return (
    <div className="space-y-6">
      <CatalogUploader existingContent={catalogContent} userId={userId} />
      <ResourceUploadForm />
      <ResourcesList />
    </div>
  );
};

export default ResourcesTab;
