import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Search, Upload, FileSpreadsheet, Loader2, Trash2, AlertCircle, CheckCircle2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { format, isValid } from 'date-fns';

interface StudentGrade {
  id: string;
  student_id: string;
  class_name: string;
  semester: string;
  attitude: string | null;
  homework: string | null;
  participation: string | null;
  test_quiz: string | null;
  comments: string | null;
  import_batch_id: string | null;
  created_at: string;
  students?: {
    first_name: string;
    last_name: string;
    student_number: string | null;
  };
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  student_number: string | null;
}

interface ParsedRow {
  student_id_raw: string;
  first_name: string;
  last_name: string;
  class_name: string;
  semester: string;
  attitude: string;
  homework: string;
  participation: string;
  test_quiz: string;
  comments: string;
  matched_student?: Student;
  name_mismatch?: boolean;
  error?: string;
}

const semesterOptions = [
  'Fall 2024', 'Winter 2024', 'Spring 2025', 'Summer 2025',
  'Fall 2025', 'Winter 2025', 'Spring 2026', 'Summer 2026',
];

const GradesTab = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSemester, setFilterSemester] = useState<string>('all');
  const [importState, setImportState] = useState<'idle' | 'preview' | 'importing'>('idle');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [editingGrade, setEditingGrade] = useState<StudentGrade | null>(null);
  const [editForm, setEditForm] = useState({
    class_name: '', semester: '', attitude: '', homework: '',
    participation: '', test_quiz: '', comments: '',
  });

  const { data: students = [] } = useQuery({
    queryKey: ['students_with_numbers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, student_number')
        .eq('active', true)
        .order('last_name');
      if (error) throw error;
      return data as Student[];
    },
  });

  const { data: grades = [], isLoading } = useQuery({
    queryKey: ['student_grades', filterSemester],
    queryFn: async () => {
      let query = supabase
        .from('student_grades')
        .select('*, students(first_name, last_name, student_number)')
        .order('created_at', { ascending: false });
      if (filterSemester !== 'all') {
        query = query.eq('semester', filterSemester);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as StudentGrade[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('student_grades').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_grades'] });
      toast.success('Grade record deleted');
    },
    onError: () => toast.error('Failed to delete grade record'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, string | null> }) => {
      const { error } = await supabase.from('student_grades').update(updates).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_grades'] });
      toast.success('Grade updated');
      setEditingGrade(null);
    },
    onError: () => toast.error('Failed to update grade'),
  });

  const openEdit = (g: StudentGrade) => {
    setEditingGrade(g);
    setEditForm({
      class_name: g.class_name, semester: g.semester,
      attitude: g.attitude || '', homework: g.homework || '',
      participation: g.participation || '', test_quiz: g.test_quiz || '',
      comments: g.comments || '',
    });
  };

  const saveEdit = () => {
    if (!editingGrade) return;
    updateMutation.mutate({
      id: editingGrade.id,
      updates: {
        class_name: editForm.class_name,
        semester: editForm.semester,
        attitude: editForm.attitude || null,
        homework: editForm.homework || null,
        participation: editForm.participation || null,
        test_quiz: editForm.test_quiz || null,
        comments: editForm.comments || null,
      },
    });
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const XLSX = await import('xlsx');
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          toast.error('The spreadsheet appears to be empty (no data rows found)');
          return;
        }

        const headers = Object.keys(jsonData[0]);
        const findCol = (keywords: string[]) =>
          headers.find((h) =>
            keywords.some((kw) => h.toLowerCase().trim().replace(/\s+/g, ' ') === kw.toLowerCase())
          ) || headers.find((h) =>
            keywords.some((kw) => h.toLowerCase().trim().includes(kw.toLowerCase()))
          );

        const studentIdCol = findCol(['student id', 'student_id', 'studentid', 'id']);
        const firstNameCol = findCol(['first name', 'first_name', 'firstname']);
        const lastNameCol = findCol(['last name', 'last_name', 'lastname']);
        const classCol = findCol(['class', 'course', 'subject']);
        const semesterCol = findCol(['semester', 'term', 'period']);
        const attitudeCol = findCol(['attitude']);
        const homeworkCol = findCol(['homework']);
        const participationCol = findCol(['participation']);
        const testQuizCol = findCol(['test / quiz', 'test/quiz', 'test_quiz', 'test', 'quiz']);
        const commentsCol = findCol(['comments', 'comment', 'notes']);

        if (!studentIdCol) {
          toast.error('Missing required column: "Student ID". Check your spreadsheet headers.');
          return;
        }

        const errors: string[] = [];
        const rows: ParsedRow[] = jsonData
          .filter((row) => {
            const sid = String(row[studentIdCol] || '').trim();
            return sid !== '' && sid !== '0';
          })
          .map((row, idx) => {
            const studentIdRaw = String(row[studentIdCol] || '').trim();
            const firstName = firstNameCol ? String(row[firstNameCol] || '').trim() : '';
            const lastName = lastNameCol ? String(row[lastNameCol] || '').trim() : '';

            const matchedStudent = students.find((s) => s.student_number === studentIdRaw);

            let nameMismatch = false;
            if (matchedStudent && firstName && lastName) {
              const dbFirst = matchedStudent.first_name.toLowerCase().trim();
              const dbLast = matchedStudent.last_name.toLowerCase().trim();
              if (dbFirst !== firstName.toLowerCase() || dbLast !== lastName.toLowerCase()) {
                nameMismatch = true;
              }
            }

            if (!matchedStudent) {
              errors.push(`Row ${idx + 2}: Student ID "${studentIdRaw}" (${firstName} ${lastName}) not found in database`);
            } else if (nameMismatch) {
              errors.push(`Row ${idx + 2}: Name mismatch — Excel: "${firstName} ${lastName}" vs DB: "${matchedStudent.first_name} ${matchedStudent.last_name}" (ID: ${studentIdRaw})`);
            }

            return {
              student_id_raw: studentIdRaw,
              first_name: firstName,
              last_name: lastName,
              class_name: classCol ? String(row[classCol] || '').trim() : '',
              semester: semesterCol ? String(row[semesterCol] || '').trim() : '',
              attitude: attitudeCol ? String(row[attitudeCol] || '').trim() : '',
              homework: homeworkCol ? String(row[homeworkCol] || '').trim() : '',
              participation: participationCol ? String(row[participationCol] || '').trim() : '',
              test_quiz: testQuizCol ? String(row[testQuizCol] || '').trim() : '',
              comments: commentsCol ? String(row[commentsCol] || '').trim() : '',
              matched_student: matchedStudent || undefined,
              name_mismatch: nameMismatch,
              error: !matchedStudent ? `Student ID "${studentIdRaw}" not found` : undefined,
            };
          });

        setParsedRows(rows);
        setImportErrors(errors);
        setImportState('preview');
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse spreadsheet. Make sure it's a valid .xlsx or .xls file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [students]);

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.matched_student);
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImportState('importing');
    const batchId = crypto.randomUUID();

    try {
      const inserts = validRows.map((r) => ({
        student_id: r.matched_student!.id,
        class_name: r.class_name,
        semester: r.semester,
        attitude: r.attitude || null,
        homework: r.homework || null,
        participation: r.participation || null,
        test_quiz: r.test_quiz || null,
        comments: r.comments || null,
        imported_by: user?.id || null,
        import_batch_id: batchId,
      }));

      const { error } = await supabase.from('student_grades').insert(inserts);
      if (error) throw error;

      toast.success(`Imported ${validRows.length} report card records`);
      queryClient.invalidateQueries({ queryKey: ['student_grades'] });
      setImportState('idle');
      setParsedRows([]);
      setImportErrors([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to import grades');
      setImportState('preview');
    }
  };

  const filteredGrades = grades.filter((g) => {
    const studentName = g.students
      ? `${g.students.first_name} ${g.students.last_name}`.toLowerCase()
      : '';
    const term = searchTerm.toLowerCase();
    return (
      studentName.includes(term) ||
      g.class_name.toLowerCase().includes(term) ||
      g.semester.toLowerCase().includes(term)
    );
  });

  const matchedCount = parsedRows.filter((r) => r.matched_student).length;
  const mismatchCount = parsedRows.filter((r) => r.name_mismatch).length;

  return (
    <div className="space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 text-green-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Import Report Cards from Excel</CardTitle>
              <CardDescription>
                Upload the PrepHaus Report Card template (.xlsx) — matched by Student ID
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {importState === 'idle' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    Choose Excel File
                  </div>
                </label>
                <span className="text-sm text-muted-foreground">
                  Columns: Student ID, First Name, Last Name, Class, Semester, Attitude, Homework, Participation, Test/Quiz, Comments
                </span>
              </div>
              {students.filter(s => !s.student_number).length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {students.filter(s => !s.student_number).length} student(s) don't have a Student ID assigned.
                    Add IDs in the Students tab before importing.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {importState === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                  {parsedRows.length} total rows
                </Badge>
                <Badge variant="default" className="gap-1.5 px-3 py-1.5 text-sm bg-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {matchedCount} matched
                </Badge>
                {parsedRows.length - matchedCount > 0 && (
                  <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm">
                    {parsedRows.length - matchedCount} unmatched
                  </Badge>
                )}
                {mismatchCount > 0 && (
                  <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm border-yellow-400 bg-yellow-50 text-yellow-700">
                    {mismatchCount} name mismatch(es)
                  </Badge>
                )}
              </div>

              {importErrors.length > 0 && (
                <Alert variant={importErrors.some(e => e.includes('not found')) ? 'destructive' : 'default'}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <span className="font-medium">{importErrors.length} issue(s) found:</span>
                    <ul className="mt-2 space-y-1 text-xs max-h-32 overflow-y-auto">
                      {importErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              <div className="rounded-md border max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Status</TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name (Excel)</TableHead>
                      <TableHead>Name (DB)</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead>Attitude</TableHead>
                      <TableHead>Homework</TableHead>
                      <TableHead>Participation</TableHead>
                      <TableHead>Test/Quiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, i) => (
                      <TableRow
                        key={i}
                        className={row.error ? 'bg-destructive/5' : row.name_mismatch ? 'bg-yellow-50' : ''}
                      >
                        <TableCell>
                          {row.matched_student && !row.name_mismatch ? (
                            <Badge variant="default" className="bg-green-500 text-xs">Match</Badge>
                          ) : row.name_mismatch ? (
                            <Badge variant="secondary" className="text-xs border-yellow-400 bg-yellow-100 text-yellow-700">Name?</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">No ID</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{row.student_id_raw}</TableCell>
                        <TableCell className="text-sm">{row.first_name} {row.last_name}</TableCell>
                        <TableCell className="text-sm">
                          {row.matched_student
                            ? `${row.matched_student.first_name} ${row.matched_student.last_name}`
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-sm">{row.class_name}</TableCell>
                        <TableCell className="text-sm">{row.semester}</TableCell>
                        <TableCell className="text-sm">{row.attitude || '—'}</TableCell>
                        <TableCell className="text-sm">{row.homework || '—'}</TableCell>
                        <TableCell className="text-sm">{row.participation || '—'}</TableCell>
                        <TableCell className="text-sm">{row.test_quiz || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setImportState('idle'); setParsedRows([]); setImportErrors([]); }}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={matchedCount === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {matchedCount} Report Card{matchedCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {importState === 'importing' && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Importing report cards...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grades List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Student Report Cards</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by student, class, or semester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterSemester} onValueChange={setFilterSemester}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesterOptions.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>Attitude</TableHead>
                    <TableHead>Homework</TableHead>
                    <TableHead>Participation</TableHead>
                    <TableHead>Test/Quiz</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Imported</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        No report cards found. Import an Excel file to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredGrades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          {g.students ? `${g.students.first_name} ${g.students.last_name}` : 'Unknown'}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{g.students?.student_number || '—'}</TableCell>
                        <TableCell>{g.class_name}</TableCell>
                        <TableCell>{g.semester}</TableCell>
                        <TableCell>{g.attitude ? <Badge variant="outline">{g.attitude}</Badge> : '—'}</TableCell>
                        <TableCell>{g.homework ? <Badge variant="outline">{g.homework}</Badge> : '—'}</TableCell>
                        <TableCell>{g.participation ? <Badge variant="outline">{g.participation}</Badge> : '—'}</TableCell>
                        <TableCell>{g.test_quiz ? <Badge variant="outline">{g.test_quiz}</Badge> : '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{g.comments || '—'}</TableCell>
                        <TableCell className="text-sm">
                          {g.created_at && isValid(new Date(g.created_at)) ? format(new Date(g.created_at), 'MMM d, yyyy') : '—'}
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(g)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(g.id)}>
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
      {/* Edit Dialog */}
      <Dialog open={!!editingGrade} onOpenChange={(open) => !open && setEditingGrade(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Grade — {editingGrade?.students ? `${editingGrade.students.first_name} ${editingGrade.students.last_name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Class</Label>
                <Input value={editForm.class_name} onChange={(e) => setEditForm(f => ({ ...f, class_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={editForm.semester} onValueChange={(v) => setEditForm(f => ({ ...f, semester: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Attitude</Label>
                <Input value={editForm.attitude} onChange={(e) => setEditForm(f => ({ ...f, attitude: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Homework</Label>
                <Input value={editForm.homework} onChange={(e) => setEditForm(f => ({ ...f, homework: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Participation</Label>
                <Input value={editForm.participation} onChange={(e) => setEditForm(f => ({ ...f, participation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Test/Quiz</Label>
                <Input value={editForm.test_quiz} onChange={(e) => setEditForm(f => ({ ...f, test_quiz: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comments</Label>
              <Textarea value={editForm.comments} onChange={(e) => setEditForm(f => ({ ...f, comments: e.target.value }))} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGrade(null)}>Cancel</Button>
            <Button onClick={saveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GradesTab;

