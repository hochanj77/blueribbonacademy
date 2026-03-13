import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  grade_level: string | null;
  school: string | null;
  parent_name: string | null;
  parent_email: string | null;
  parent_phone: string | null;
  notes: string | null;
  active: boolean;
}

interface ProgressNote {
  id: string;
  content: string;
  created_at: string;
  tutor_id: string | null;
}
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
}

const StudentDetails = ({ student, onClose }: StudentDetailsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: progressNotes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['progress-notes', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_notes')
        .select('*')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ProgressNote[];
    },
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {student.first_name} {student.last_name}
        </DialogTitle>
      </DialogHeader>

      <Tabs defaultValue="info" className="mt-4">
        <TabsList>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="notes">Progress Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <StudentInfoCard student={student} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ProgressNotesSection
            studentId={student.id}
            notes={progressNotes}
            isLoading={notesLoading}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

const StudentInfoCard = ({ student }: { student: Student }) => {
  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{student.email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span>{student.phone || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Grade:</span>
            <span>{student.grade_level || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">School:</span>
            <span>{student.school || '-'}</span>
          </div>
         <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            {(student as any).status === 'active' ? (
              <Badge className="bg-green-500 hover:bg-green-500/80 text-primary-foreground border-transparent">Active</Badge>
            ) : (student as any).status === 'pending' ? (
              <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground border-transparent">Pending</Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parent/Guardian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span>{student.parent_name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Email:</span>
            <span>{student.parent_email || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone:</span>
            <span>{student.parent_phone || '-'}</span>
          </div>
        </CardContent>
      </Card>

      {student.notes && (
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{student.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


const ProgressNotesSection = ({
  studentId,
  notes,
  isLoading,
}: {
  studentId: string;
  notes: ProgressNote[];
  isLoading: boolean;
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const queryClient = useQueryClient();

  const addNoteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('progress_notes').insert({
        student_id: studentId,
        content: newNote,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-notes', studentId] });
      setIsAddingNote(false);
      setNewNote('');
      toast.success('Note added');
    },
    onError: () => {
      toast.error('Failed to add note');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('progress_notes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-notes', studentId] });
      toast.success('Note deleted');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Progress Notes</h3>
        <Button size="sm" onClick={() => setIsAddingNote(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isAddingNote && (
        <Card>
          <CardContent className="pt-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Write a progress note..."
              rows={4}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingNote(false)}>
                Cancel
              </Button>
              <Button onClick={() => addNoteMutation.mutate()} disabled={!newNote.trim()}>
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No progress notes</p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {format(new Date(note.created_at), 'MMM d, yyyy h:mm a')}
                    </p>
                    <p>{note.content}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteNoteMutation.mutate(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};


export default StudentDetails;
