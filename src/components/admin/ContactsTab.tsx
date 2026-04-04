import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Mail, Phone, BookOpen, Search, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  grade: string | null;
  subjects: string[] | null;
  message: string;
  wants_catalog: boolean;
  created_at: string;
}

const PAGE_SIZE = 25;

export default function ContactsTab() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editingContact, setEditingContact] = useState<ContactSubmission | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '', message: '' });

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contact-submissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ContactSubmission[];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: { id: string; name: string; email: string; phone: string | null; message: string }) => {
      const { error } = await supabase
        .from('contact_submissions')
        .update({ name: updates.name, email: updates.email, phone: updates.phone, message: updates.message })
        .eq('id', updates.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Contact updated');
      queryClient.invalidateQueries({ queryKey: ['contact-submissions'] });
      setEditingContact(null);
    },
    onError: () => toast.error('Failed to update contact'),
  });

  const filtered = contacts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      c.message.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Reset to first page when search changes
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const openEdit = (c: ContactSubmission) => {
    setEditingContact(c);
    setEditForm({ name: c.name, email: c.email, phone: c.phone || '', message: c.message });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Contact Submissions</h2>
          <p className="text-sm text-muted-foreground">
            {filtered.length} contact{filtered.length !== 1 ? 's' : ''}
            {search && ` matching "${search}"`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {paginated.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          {search ? 'No contacts match your search' : 'No contact submissions yet'}
        </p>
      ) : (
        <div className="space-y-3">
          {paginated.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{c.name}</h4>
                      {c.wants_catalog && (
                        <Badge variant="outline" className="gap-1">
                          <BookOpen className="h-3 w-3" />
                          Wants Catalog
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {c.email}
                      </span>
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {c.phone}
                        </span>
                      )}
                      {c.grade && <span>Grade: {c.grade}</span>}
                    </div>

                    {c.subjects && c.subjects.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {c.subjects.map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-foreground whitespace-pre-wrap">{c.message}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(c.created_at), 'MMM d, yyyy')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {page + 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingContact} onOpenChange={(open) => !open && setEditingContact(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editingContact) return;
              updateMutation.mutate({
                id: editingContact.id,
                name: editForm.name,
                email: editForm.email,
                phone: editForm.phone || null,
                message: editForm.message,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={editForm.message} onChange={(e) => setEditForm({ ...editForm, message: e.target.value })} rows={4} required />
            </div>
            <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
