import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface ReportCard {
  id: string;
  student_id: string;
  title: string;
  file_path: string;
  term: string | null;
  year: number | null;
  uploaded_by: string | null;
  created_at: string | null;
  students?: Student;
}

function generateTermOptions() {
  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const now = new Date();
  const startYear = now.getFullYear() - 1;
  const endYear = now.getFullYear() + 1;
  const options: { value: string; label: string }[] = [];
  for (let year = startYear; year <= endYear; year++) {
    for (const season of seasons) {
      const val = `${season} ${year}`;
      options.push({ value: val, label: val });
    }
  }
  return options;
}

const termOptions = generateTermOptions();

const ReportCardsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name')
        .eq('active', true)
        .order('last_name', { ascending: true });
      if (error) throw error;
      return data as Student[];
    },
  });

  const { data: reportCards = [], isLoading } = useQuery({
    queryKey: ['report_cards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('report_cards')
        .select('*, students(id, first_name, last_name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ReportCard[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('report_cards').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report_cards'] });
      toast.success('Report card deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete report card');
    },
  });

  const filteredReportCards = reportCards.filter((rc) => {
    const studentName = rc.students
      ? `${rc.students.first_name} ${rc.students.last_name}`.toLowerCase()
      : '';
    return (
      studentName.includes(searchTerm.toLowerCase()) ||
      (rc.term?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      rc.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Report Card Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Report Card
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Report Card</DialogTitle>
            </DialogHeader>
            <ReportCardForm
              students={students}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['report_cards'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by student or term..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReportCards.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No report cards found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredReportCards.map((rc) => (
                    <TableRow key={rc.id}>
                      <TableCell className="font-medium">
                        {rc.students
                          ? `${rc.students.first_name} ${rc.students.last_name}`
                          : 'Unknown'}
                      </TableCell>
                      <TableCell>{rc.title}</TableCell>
                      <TableCell>{rc.term || '-'}</TableCell>
                      <TableCell>{rc.year || '-'}</TableCell>
                      <TableCell>
                        {rc.created_at ? format(new Date(rc.created_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(rc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ReportCardFormProps {
  students: Student[];
  onSuccess: () => void;
}

const ReportCardForm = ({ students, onSuccess }: ReportCardFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    term: '',
    title: '',
    file_path: '',
    year: new Date().getFullYear(),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('report_cards').insert({
        student_id: formData.student_id,
        title: formData.title,
        file_path: formData.file_path,
        term: formData.term || null,
        year: formData.year,
      });
      if (error) throw error;
      toast.success('Report card added successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to add report card');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="student">Student *</Label>
          <Select
            value={formData.student_id}
            onValueChange={(value) => setFormData({ ...formData, student_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.first_name} {student.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="term">Term *</Label>
          <Select
            value={formData.term}
            onValueChange={(value) => setFormData({ ...formData, term: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent>
              {termOptions.map((term) => (
                <SelectItem key={term.value} value={term.value}>
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="e.g., Mid-Term Report Card"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file_path">File Path / URL *</Label>
        <Input
          id="file_path"
          value={formData.file_path}
          onChange={(e) => setFormData({ ...formData, file_path: e.target.value })}
          placeholder="e.g., /reports/student-report.pdf"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="year">Year</Label>
        <Input
          id="year"
          type="number"
          value={formData.year}
          onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting || !formData.student_id || !formData.title || !formData.file_path}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Add Report Card
        </Button>
      </div>
    </form>
  );
};

export default ReportCardsTab;
