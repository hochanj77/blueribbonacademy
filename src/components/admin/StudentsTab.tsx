import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Search, Trash2, FileText, Download, Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import StudentDetails from './StudentDetails';
import * as XLSX from 'xlsx';

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
  created_at: string;
  student_number: string | null;
  status: string;
}

interface ParsedStudentRow {
  student_id_raw: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  grade_level: string;
  school: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  notes: string;
  matched_student?: Student;
  import_type: 'new' | 'update' | 'error';
  error?: string;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'active':
      return <Badge className="bg-green-500 hover:bg-green-500/80 text-primary-foreground border-transparent">Active</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500 hover:bg-yellow-500/80 text-primary-foreground border-transparent">Pending</Badge>;
    case 'inactive':
      return <Badge variant="secondary">Inactive</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const StudentsTab = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [importState, setImportState] = useState<'idle' | 'preview' | 'importing'>('idle');
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('students-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
        queryClient.invalidateQueries({ queryKey: ['students'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('account_type', 'student')
        .order('last_name', { ascending: true });
      if (error) throw error;
      return data as Student[];
    },
  });

  const deleteStudentWithRelations = async (studentId: string) => {
    // Delete all related records first
    const tables = ['student_grades', 'attendance', 'progress_notes', 'report_cards', 'student_enrollments'] as const;
    for (const table of tables) {
      const { error } = await supabase.from(table).delete().eq('student_id', studentId);
      if (error) throw error;
    }
    // Nullify any linked_student_id references pointing to this student
    const { error: unlinkError } = await supabase
      .from('students')
      .update({ linked_student_id: null })
      .eq('linked_student_id', studentId);
    if (unlinkError) throw unlinkError;
    // Then delete the student
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
  };

  const deleteMutation = useMutation({
    mutationFn: deleteStudentWithRelations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success('Student deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete student');
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await deleteStudentWithRelations(id);
      }
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`${ids.length} student(s) deleted`);
      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
    },
    onError: () => {
      toast.error('Failed to delete students');
    },
  });

  const filteredStudents = useMemo(() => students.filter((student) => {
    const matchesSearch =
      `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.school?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.student_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, statusFilter]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  }, [selectedIds.size, filteredStudents]);


  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s) => ({
      'Student ID': s.student_number || '-',
      'First Name': s.first_name,
      'Last Name': s.last_name,
      'Email': s.email || '',
      'Phone': s.phone || '',
      'Grade': s.grade_level || '',
      'School': s.school || '',
      'Parent Name': s.parent_name || '',
      'Parent Email': s.parent_email || '',
      'Parent Phone': s.parent_phone || '',
      'Status': s.status || (s.active ? 'active' : 'inactive'),
      'Notes': s.notes || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'students_export.xlsx');
    toast.success('Students exported to Excel');
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'First Name': 'John',
        'Last Name': 'Doe',
        'Phone': '555-0100',
        'Grade Level': '10th Grade',
        'School': 'Lincoln High',
        'Parent Name': 'Jane Doe',
        'Parent Email': 'jane@example.com',
        'Parent Phone': '555-0101',
        'Notes': 'Example student',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
    toast.success('Template downloaded');
  };

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          toast.error('The spreadsheet appears to be empty');
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
        const emailCol = findCol(['email', 'e-mail']);
        const phoneCol = findCol(['phone', 'telephone']);
        const gradeCol = findCol(['grade level', 'grade_level', 'grade']);
        const schoolCol = findCol(['school']);
        const parentNameCol = findCol(['parent name', 'parent_name', 'guardian name']);
        const parentEmailCol = findCol(['parent email', 'parent_email', 'guardian email']);
        const parentPhoneCol = findCol(['parent phone', 'parent_phone', 'guardian phone']);
        const notesCol = findCol(['notes', 'note', 'comments']);

        if (!firstNameCol || !lastNameCol) {
          toast.error('Missing required columns: "First Name" and "Last Name"');
          return;
        }

        const errors: string[] = [];
        const rows: ParsedStudentRow[] = jsonData
          .filter((row) => {
            const fn = String(row[firstNameCol] || '').trim();
            const ln = String(row[lastNameCol] || '').trim();
            return fn !== '' && ln !== '';
          })
          .map((row, idx) => {
            const studentIdRaw = studentIdCol ? String(row[studentIdCol] || '').trim() : '';
            const firstName = String(row[firstNameCol] || '').trim();
            const lastName = String(row[lastNameCol] || '').trim();
            const email = emailCol ? String(row[emailCol] || '').trim() : '';

            let matchedStudent: Student | undefined;
            let importType: 'new' | 'update' | 'error' = 'new';
            let error: string | undefined;

            // Try to match by student_number first
            if (studentIdRaw) {
              matchedStudent = students.find(
                (s) => s.student_number?.toUpperCase() === studentIdRaw.toUpperCase()
              );
            }

            if (matchedStudent) {
              importType = 'update';
            } else {
              if (!firstName || !lastName) {
                importType = 'error';
                error = 'Missing first or last name';
                errors.push(`Row ${idx + 2}: Missing required name fields`);
              }
            }

            return {
              student_id_raw: studentIdRaw,
              first_name: firstName,
              last_name: lastName,
              email,
              phone: phoneCol ? String(row[phoneCol] || '').trim() : '',
              grade_level: gradeCol ? String(row[gradeCol] || '').trim() : '',
              school: schoolCol ? String(row[schoolCol] || '').trim() : '',
              parent_name: parentNameCol ? String(row[parentNameCol] || '').trim() : '',
              parent_email: parentEmailCol ? String(row[parentEmailCol] || '').trim() : '',
              parent_phone: parentPhoneCol ? String(row[parentPhoneCol] || '').trim() : '',
              notes: notesCol ? String(row[notesCol] || '').trim() : '',
              matched_student: matchedStudent,
              import_type: importType,
              error,
            };
          });

        setParsedRows(rows);
        setImportErrors(errors);
        setImportState('preview');
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse spreadsheet. Make sure it's a valid .xlsx file.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  }, [students]);

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.import_type !== 'error');
    if (validRows.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setImportState('importing');

    try {
      const newRows = validRows.filter((r) => r.import_type === 'new');
      const updateRows = validRows.filter((r) => r.import_type === 'update');

      // Insert new students
      if (newRows.length > 0) {
        const inserts = newRows.map((r) => ({
          first_name: r.first_name,
          last_name: r.last_name,
          phone: r.phone || null,
          grade_level: r.grade_level || null,
          school: r.school || null,
          parent_name: r.parent_name || null,
          parent_email: r.parent_email || null,
          parent_phone: r.parent_phone || null,
          notes: r.notes || null,
          status: 'pending',
          active: true,
          account_type: 'student',
        }));

        const { error } = await supabase.from('students').insert(inserts);
        if (error) throw error;
      }

      // Update existing students
      for (const r of updateRows) {
        if (!r.matched_student) continue;
        const updates: Record<string, unknown> = {};
        if (r.first_name) updates.first_name = r.first_name;
        if (r.last_name) updates.last_name = r.last_name;
        
        if (r.phone) updates.phone = r.phone;
        if (r.grade_level) updates.grade_level = r.grade_level;
        if (r.school) updates.school = r.school;
        if (r.parent_name) updates.parent_name = r.parent_name;
        if (r.parent_email) updates.parent_email = r.parent_email;
        if (r.parent_phone) updates.parent_phone = r.parent_phone;
        if (r.notes) updates.notes = r.notes;

        if (Object.keys(updates).length > 0) {
          const { error } = await supabase
            .from('students')
            .update(updates)
            .eq('id', r.matched_student.id);
          if (error) throw error;
        }
      }

      toast.success(`Imported ${newRows.length} new + ${updateRows.length} updated students`);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setImportState('idle');
      setParsedRows([]);
      setImportErrors([]);
    } catch (err) {
      console.error(err);
      toast.error('Failed to import students');
      setImportState('preview');
    }
  };

  const newCount = parsedRows.filter((r) => r.import_type === 'new').length;
  const updateCount = parsedRows.filter((r) => r.import_type === 'update').length;
  const errorCount = parsedRows.filter((r) => r.import_type === 'error').length;

  const pendingCount = students.filter((s) => s.status === 'pending').length;
  const activeCount = students.filter((s) => s.status === 'active').length;
  const inactiveCount = students.filter((s) => s.status === 'inactive').length;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Import Section */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base md:text-lg">Import Students from Excel</CardTitle>
              <CardDescription className="hidden sm:block">
                Upload an .xlsx file to mass-create or update student records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          {importState === 'idle' && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <label className="cursor-pointer">
                <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileUpload} className="hidden" />
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium">
                  <Upload className="h-4 w-4" />
                  Choose Excel File
                </div>
              </label>
              <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Template
              </Button>
              <span className="text-xs sm:text-sm text-muted-foreground hidden md:inline">
                Columns: First Name, Last Name, Phone, Grade Level, School, Parent Name, Parent Email, Parent Phone, Notes
              </span>
            </div>
          )}

          {importState === 'preview' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-sm">
                  {parsedRows.length} total rows
                </Badge>
                {newCount > 0 && (
                  <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-green-500 hover:bg-green-500/80 text-primary-foreground border-transparent">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {newCount} new
                  </Badge>
                )}
                {updateCount > 0 && (
                  <Badge className="gap-1.5 px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-500/80 text-primary-foreground border-transparent">
                    {updateCount} update
                  </Badge>
                )}
                {errorCount > 0 && (
                  <Badge variant="destructive" className="gap-1.5 px-3 py-1.5 text-sm">
                    {errorCount} error(s)
                  </Badge>
                )}
              </div>

              {importErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="mt-1 space-y-1 text-xs">
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
                      <TableHead>Name</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.map((row, i) => (
                      <TableRow
                        key={i}
                        className={row.import_type === 'error' ? 'bg-destructive/5' : ''}
                      >
                        <TableCell>
                          {row.import_type === 'new' ? (
                            <Badge className="text-xs bg-green-500 hover:bg-green-500/80 text-primary-foreground border-transparent">New</Badge>
                          ) : row.import_type === 'update' ? (
                            <Badge className="text-xs bg-blue-500 hover:bg-blue-500/80 text-primary-foreground border-transparent">Update</Badge>
                          ) : (
                            <Badge variant="destructive" className="text-xs">Error</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {row.matched_student?.student_number || row.student_id_raw || '—'}
                        </TableCell>
                        <TableCell className="text-sm">{row.first_name} {row.last_name}</TableCell>
                        <TableCell className="text-sm">{row.grade_level || '—'}</TableCell>
                        <TableCell className="text-sm">{row.school || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => { setImportState('idle'); setParsedRows([]); setImportErrors([]); }}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={newCount + updateCount === 0}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import {newCount + updateCount} Student{newCount + updateCount !== 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          )}

          {importState === 'importing' && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Importing students...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base md:text-lg">Student Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExportExcel}>
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export Excel</span>
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Add Student</span>
                  </Button>
                </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                </DialogHeader>
                <StudentForm
                  onSuccess={() => {
                    setIsAddDialogOpen(false);
                    queryClient.invalidateQueries({ queryKey: ['students'] });
                  }}
                />
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4 md:mb-6">
            <div className="relative flex-1 w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({students.length})</SelectItem>
                <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                <SelectItem value="active">Active ({activeCount})</SelectItem>
                <SelectItem value="inactive">Inactive ({inactiveCount})</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-3 mb-4 p-3 rounded-md bg-muted border">
              <span className="text-sm font-medium">
                {selectedIds.size} selected
              </span>
              <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="gap-2">
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Delete Selected</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedIds.size} Student{selectedIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {selectedIds.size} student record{selectedIds.size !== 1 ? 's' : ''} and all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => bulkDeleteMutation.mutate(Array.from(selectedIds))}
                      disabled={bulkDeleteMutation.isPending}
                    >
                      {bulkDeleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox
                          checked={filteredStudents.length > 0 && selectedIds.size === filteredStudents.length}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Student ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No students found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className={selectedIds.has(student.id) ? 'bg-muted/50' : ''}>
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(student.id)}
                              onCheckedChange={() => toggleSelect(student.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {student.student_number || '-'}
                          </TableCell>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell>{student.email || '-'}</TableCell>
                          <TableCell>{student.grade_level || '-'}</TableCell>
                          <TableCell>{student.school || '-'}</TableCell>
                          <TableCell>
                            {getStatusBadge(student.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsDetailsOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Student</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {student.first_name} {student.last_name}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => deleteMutation.mutate(student.id)}>
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden space-y-3">
                {filteredStudents.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No students found</p>
                ) : (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`border border-border rounded-lg p-3 space-y-2 ${selectedIds.has(student.id) ? 'bg-muted/50 border-primary/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          <Checkbox
                            checked={selectedIds.has(student.id)}
                            onCheckedChange={() => toggleSelect(student.id)}
                            className="mt-0.5"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {student.first_name} {student.last_name}
                            </p>
                            {student.student_number && (
                              <p className="text-xs text-muted-foreground font-mono">{student.student_number}</p>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(student.status)}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs ml-6">
                        {student.email && (
                          <>
                            <span className="text-muted-foreground">Email</span>
                            <span className="truncate">{student.email}</span>
                          </>
                        )}
                        {student.grade_level && (
                          <>
                            <span className="text-muted-foreground">Grade</span>
                            <span>{student.grade_level}</span>
                          </>
                        )}
                        {student.school && (
                          <>
                            <span className="text-muted-foreground">School</span>
                            <span className="truncate">{student.school}</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center justify-end gap-1 ml-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Student</AlertDialogTitle>
                              <AlertDialogDescription>
                                Delete {student.first_name} {student.last_name}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteMutation.mutate(student.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              {selectedStudent && (
                <StudentDetails
                  student={selectedStudent}
                  onClose={() => setIsDetailsOpen(false)}
                />
              )}
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
};

interface StudentFormProps {
  student?: Student;
  onSuccess: () => void;
}

const StudentForm = ({ student, onSuccess }: StudentFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: student?.first_name || '',
    last_name: student?.last_name || '',
    email: student?.email || '',
    phone: student?.phone || '',
    grade_level: student?.grade_level || '',
    school: student?.school || '',
    parent_name: student?.parent_name || '',
    parent_email: student?.parent_email || '',
    parent_phone: student?.parent_phone || '',
    notes: student?.notes || '',
    active: student?.active ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (student) {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', student.id);
        if (error) throw error;
        toast.success('Student updated successfully');
      } else {
        const { error } = await supabase.from('students').insert({
          ...formData,
          status: 'pending',
          account_type: 'student',
        });
        if (error) throw error;
        toast.success('Student added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save student');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="grade_level">Grade Level</Label>
          <Input
            id="grade_level"
            value={formData.grade_level}
            onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
            placeholder="e.g., 10th Grade"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="school">School</Label>
          <Input
            id="school"
            value={formData.school}
            onChange={(e) => setFormData({ ...formData, school: e.target.value })}
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Parent/Guardian Information</h4>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="parent_name">Name</Label>
            <Input
              id="parent_name"
              value={formData.parent_name}
              onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_email">Email</Label>
            <Input
              id="parent_email"
              type="email"
              value={formData.parent_email}
              onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parent_phone">Phone</Label>
            <Input
              id="parent_phone"
              value={formData.parent_phone}
              onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {student ? 'Update Student' : 'Add Student'}
        </Button>
      </div>
    </form>
  );
};

export default StudentsTab;
