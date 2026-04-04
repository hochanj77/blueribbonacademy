import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, BookOpen } from 'lucide-react';
import { format } from 'date-fns';

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

export default function ContactsTab() {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Contact Submissions</h2>
        <p className="text-sm text-muted-foreground">
          {contacts.length} total submission{contacts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {contacts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No contact submissions yet</p>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
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

                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {format(new Date(c.created_at), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
