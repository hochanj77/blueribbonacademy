import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Loader2, Trash2, Pencil, Save, X } from 'lucide-react';
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
interface StudentDetailsProps {
  student: Student;
  onClose: () => void;
}

const StudentDetails = ({ student, onClose }: StudentDetailsProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editedStudent, setEditedStudent] = useState<Partial<Student & { notes: string | null; status: string }>>({});
  const [isEditing, setIsEditing] = useState(false);
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

  const updateStudentMutation = useMutation({
    mutationFn: async (updates: Record<string, any>) => {
      const { error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsEditing(false);
      setEditedStudent({});
      toast.success('Student updated');
    },
    onError: () => {
      toast.error('Failed to update student');
    },
  });

  const handleSave = () => {
    if (Object.keys(editedStudent).length === 0) {
      setIsEditing(false);
      return;
    }
    updateStudentMutation.mutate(editedStudent);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedStudent({});
  };

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
          <div className="flex justify-end mb-2 gap-2">
            {isEditing ? (
              <>
                <Button size="sm" variant="outline" onClick={handleCancel}>
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={updateStudentMutation.isPending}>
                  <Save className="h-4 w-4 mr-1" /> Save
                </Button>
              </>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
          <StudentInfoCard
            student={student}
            isEditing={isEditing}
            editedStudent={editedStudent}
            setEditedStudent={setEditedStudent}
          />
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

const StudentInfoCard = ({
  student,
  isEditing,
  editedStudent,
  setEditedStudent,
}: {
  student: Student;
  isEditing: boolean;
  editedStudent: Record<string, any>;
  setEditedStudent: (val: any) => void;
}) => {
  const val = (field: keyof Student) => editedStudent[field] ?? (student as any)[field] ?? '';
  const set = (field: string, value: string) =>
    setEditedStudent((prev: any) => ({ ...prev, [field]: value || null }));

  const renderField = (label: string, field: keyof Student) => (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground">{label}:</span>
      {isEditing ? (
        <Input
          className="w-48 h-8 text-sm"
          value={val(field)}
          onChange={(e) => set(field, e.target.value)}
        />
      ) : (
        <span>{(student as any)[field] || '-'}</span>
      )}
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderField('Email', 'email')}
          {renderField('Phone', 'phone')}
          {renderField('Grade', 'grade_level')}
          {renderField('School', 'school')}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            {isEditing ? (
              <select
                className="w-48 h-8 text-sm border rounded-md px-2 bg-background"
                value={val('status' as any)}
                onChange={(e) => set('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            ) : (
              <>
                {(student as any).status === 'active' ? (
                  <Badge className="bg-green-500 hover:bg-green-500/80 text-primary-foreground border-transparent">Active</Badge>
                ) : (student as any).status === 'pending' ? (
                  <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground border-transparent">Pending</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parent/Guardian</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {renderField('Name', 'parent_name')}
          {renderField('Email', 'parent_email')}
          {renderField('Phone', 'parent_phone')}
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedStudent.notes ?? student.notes ?? ''}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
            />
          ) : (
            <p className="text-muted-foreground">{student.notes || 'No notes'}</p>
          )}
        </CardContent>
      </Card>
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
