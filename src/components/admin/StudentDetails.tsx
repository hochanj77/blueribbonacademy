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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Upload, Loader2, Trash2, Download } from 'lucide-react';
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

  const { data: attendance = [], isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', student.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data as Attendance[];
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
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="notes">Progress Notes</TabsTrigger>
          <TabsTrigger value="reports">Report Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4">
          <StudentInfoCard student={student} />
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          <AttendanceSection
            studentId={student.id}
            attendance={attendance}
            isLoading={attendanceLoading}
          />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <ProgressNotesSection
            studentId={student.id}
            notes={progressNotes}
            isLoading={notesLoading}
          />
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <ReportCardsSection
            studentId={student.id}
            reports={reportCards}
            isLoading={reportsLoading}
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

const AttendanceSection = ({
  studentId,
  attendance,
  isLoading,
}: {
  studentId: string;
  attendance: Attendance[];
  isLoading: boolean;
}) => {
  const [isAddingAttendance, setIsAddingAttendance] = useState(false);
  const [newAttendance, setNewAttendance] = useState<{
    date: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    notes: string;
  }>({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'present',
    notes: '',
  });
  const queryClient = useQueryClient();

  const addAttendanceMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('attendance').insert({
        student_id: studentId,
        date: newAttendance.date,
        status: newAttendance.status,
        notes: newAttendance.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', studentId] });
      setIsAddingAttendance(false);
      setNewAttendance({ date: format(new Date(), 'yyyy-MM-dd'), status: 'present', notes: '' });
      toast.success('Attendance recorded');
    },
    onError: () => {
      toast.error('Failed to record attendance');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'default';
      case 'absent':
        return 'destructive';
      case 'late':
        return 'secondary';
      case 'excused':
        return 'outline';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Attendance Records</h3>
        <Button size="sm" onClick={() => setIsAddingAttendance(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Record
        </Button>
      </div>

      {isAddingAttendance && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newAttendance.date}
                  onChange={(e) => setNewAttendance({ ...newAttendance, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={newAttendance.status}
                  onValueChange={(value: 'present' | 'absent' | 'late' | 'excused') =>
                    setNewAttendance({ ...newAttendance, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="excused">Excused</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  value={newAttendance.notes}
                  onChange={(e) => setNewAttendance({ ...newAttendance, notes: e.target.value })}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddingAttendance(false)}>
                Cancel
              </Button>
              <Button onClick={() => addAttendanceMutation.mutate()}>Save</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : attendance.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No attendance records</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance.map((record) => (
              <TableRow key={record.id}>
                <TableCell>{format(new Date(record.date), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                </TableCell>
                <TableCell>{record.notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

const ReportCardsSection = ({
  studentId,
  reports,
  isLoading,
}: {
  studentId: string;
  reports: ReportCard[];
  isLoading: boolean;
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', term: '', year: new Date().getFullYear() });
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!uploadData.title.trim()) {
      toast.error('Please enter a title for the report card');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${studentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('report-cards')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from('report_cards').insert({
        student_id: studentId,
        title: uploadData.title,
        file_path: filePath,
        term: uploadData.term || null,
        year: uploadData.year,
        uploaded_by: user?.id,
      });

      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['report-cards', studentId] });
      setUploadData({ title: '', term: '', year: new Date().getFullYear() });
      toast.success('Report card uploaded');
    } catch (error) {
      toast.error('Failed to upload report card');
    } finally {
      setIsUploading(false);
    }
  };

  const downloadReport = async (filePath: string, title: string) => {
    const { data, error } = await supabase.storage
      .from('report-cards')
      .download(filePath);

    if (error) {
      toast.error('Failed to download file');
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = title;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteReportMutation = useMutation({
    mutationFn: async (report: ReportCard) => {
      await supabase.storage.from('report-cards').remove([report.file_path]);
      const { error } = await supabase.from('report_cards').delete().eq('id', report.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-cards', studentId] });
      toast.success('Report card deleted');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Report Cards</h3>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="e.g., Q1 Report Card"
              />
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Input
                value={uploadData.term}
                onChange={(e) => setUploadData({ ...uploadData, term: e.target.value })}
                placeholder="e.g., Q1, Semester 1"
              />
            </div>
            <div className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={uploadData.year}
                onChange={(e) => setUploadData({ ...uploadData, year: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="file-upload" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary transition-colors">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to upload PDF or image
                    </p>
                  </>
                )}
              </div>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </Label>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-muted-foreground text-center py-4">No report cards uploaded</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report.id}>
                <TableCell className="font-medium">{report.title}</TableCell>
                <TableCell>{report.term || '-'}</TableCell>
                <TableCell>{report.year || '-'}</TableCell>
                <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => downloadReport(report.file_path, report.title)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReportMutation.mutate(report)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default StudentDetails;
