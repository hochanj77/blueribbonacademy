import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  target_audience: string;
  published: boolean;
  published_at: string | null;
  created_by: string | null;
  created_at: string;
}

const AnnouncementsTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['announcements-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Announcement[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      toast.success('Announcement deleted successfully');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (announcement: Announcement) => {
      const { error } = await supabase
        .from('announcements')
        .update({
          published: !announcement.published,
          published_at: !announcement.published ? new Date().toISOString() : null,
        })
        .eq('id', announcement.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
      toast.success('Announcement updated');
    },
  });

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all':
        return 'Everyone';
      case 'students':
        return 'Students';
      case 'parents':
        return 'Parents';
      default:
        return audience;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Announcements</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Announcement</DialogTitle>
            </DialogHeader>
            <AnnouncementForm
              onSuccess={() => {
                setIsAddDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No announcements yet</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{announcement.title}</h4>
                        <Badge variant={announcement.published ? 'default' : 'secondary'}>
                          {announcement.published ? 'Published' : 'Draft'}
                        </Badge>
                        <Badge variant="outline">
                          {getAudienceLabel(announcement.target_audience)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.content}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {format(new Date(announcement.created_at), 'MMM d, yyyy h:mm a')}
                        {announcement.published_at && (
                          <> • Published: {format(new Date(announcement.published_at), 'MMM d, yyyy h:mm a')}</>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant={announcement.published ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => publishMutation.mutate(announcement)}
                      >
                        <Send className="h-4 w-4 mr-1" />
                        {announcement.published ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingAnnouncement(announcement)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(announcement.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editingAnnouncement} onOpenChange={(open) => !open && setEditingAnnouncement(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Announcement</DialogTitle>
            </DialogHeader>
            {editingAnnouncement && (
              <AnnouncementForm
                announcement={editingAnnouncement}
                onSuccess={() => {
                  setEditingAnnouncement(null);
                  queryClient.invalidateQueries({ queryKey: ['announcements-admin'] });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface AnnouncementFormProps {
  announcement?: Announcement;
  onSuccess: () => void;
}

const AnnouncementForm = ({ announcement, onSuccess }: AnnouncementFormProps) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    target_audience: announcement?.target_audience || 'all',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const dataToSubmit = {
        title: formData.title,
        content: formData.content,
        target_audience: formData.target_audience,
        created_by: user?.id,
      };

      if (announcement) {
        const { error } = await supabase
          .from('announcements')
          .update(dataToSubmit)
          .eq('id', announcement.id);
        if (error) throw error;
        toast.success('Announcement updated successfully');
      } else {
        const { error } = await supabase.from('announcements').insert(dataToSubmit);
        if (error) throw error;
        toast.success('Announcement created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Content *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={6}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_audience">Target Audience</Label>
        <Select
          value={formData.target_audience}
          onValueChange={(value) => setFormData({ ...formData, target_audience: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="students">Students Only</SelectItem>
            <SelectItem value="parents">Parents Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {announcement ? 'Update' : 'Create'} Announcement
        </Button>
      </div>
    </form>
  );
};

export default AnnouncementsTab;
