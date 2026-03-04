import { useEffect, useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, GraduationCap, BookOpen, FileText, Download, ExternalLink, User } from 'lucide-react';

interface StudentGrade {
  id: string;
  class_name: string;
  semester: string;
  attitude: string | null;
  homework: string | null;
  participation: string | null;
  test_quiz: string | null;
  comments: string | null;
  created_at: string;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string | null;
  created_at: string;
}

const SEASON_ORDER: Record<string, number> = { spring: 0, summer: 1, fall: 2, winter: 3 };

function parseSemester(s: string): { year: number; season: number } {
  const parts = s.trim().split(/\s+/);
  const seasonStr = (parts[0] || '').toLowerCase();
  const year = parseInt(parts[1] || '0', 10);
  return { year: isNaN(year) ? 0 : year, season: SEASON_ORDER[seasonStr] ?? -1 };
}

function sortSemestersChronologically(semesters: string[]): string[] {
  return [...semesters].sort((a, b) => {
    const pa = parseSemester(a);
    const pb = parseSemester(b);
    if (pa.year !== pb.year) return pa.year - pb.year;
    return pa.season - pb.season;
  });
}

const ExpandableComment = ({ text }: { text: string }) => {
  const [expanded, setExpanded] = useState(false);
  if (!text) return <span>—</span>;
  if (text.length <= 50) return <span>{text}</span>;
  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className="text-left hover:text-foreground transition-colors"
    >
      {expanded ? text : `${text.slice(0, 50)}…`}
    </button>
  );
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, loading, isStudent, isAdminLoading, studentProfile } = useAuth();
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      if (!user) {
        navigate('/portal');
      } else if (!isStudent) {
        navigate('/portal');
      }
    }
  }, [user, loading, isStudent, isAdminLoading, navigate]);

  // Fetch student's grades
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['my_grades', studentProfile?.id],
    queryFn: async () => {
      if (!studentProfile?.id) return [];
      const { data, error } = await supabase
        .from('student_grades')
        .select('*')
        .eq('student_id', studentProfile.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudentGrade[];
    },
    enabled: !!studentProfile?.id,
  });

  // Compute sorted semesters and default to most recent
  const sortedSemesters = useMemo(() => {
    const unique = [...new Set(grades.map(g => g.semester).filter(Boolean))];
    return sortSemestersChronologically(unique);
  }, [grades]);

  // Set default semester to most recent once data loads
  useEffect(() => {
    if (sortedSemesters.length > 0 && selectedSemester === null) {
      setSelectedSemester(sortedSemesters[sortedSemesters.length - 1]);
    }
  }, [sortedSemesters, selectedSemester]);

  const activeSemester = selectedSemester || 'all';

  // Fetch published announcements
  const { data: announcements = [] } = useQuery({
    queryKey: ['student_announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as Announcement[];
    },
  });

  // Fetch catalog info from CMS
  const { data: catalogData } = useSiteContent('global', 'catalog');
  const catalog = catalogData?.content || {};

  if (loading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isStudent || !studentProfile) return null;

  // Filter grades by selected semester
  const filteredGrades = activeSemester === 'all'
    ? grades
    : grades.filter(g => g.semester === activeSemester);

  // Group filtered grades by semester
  const gradesBySemester: Record<string, StudentGrade[]> = {};
  filteredGrades.forEach((g) => {
    const key = g.semester || 'Other';
    if (!gradesBySemester[key]) gradesBySemester[key] = [];
    gradesBySemester[key].push(g);
  });

  // Sort the semester keys chronologically for display
  const displayOrder = sortSemestersChronologically(Object.keys(gradesBySemester));

  return (
    <div className="pb-10 md:pb-16">
      {/* Welcome Header with colored background */}
      <div className="bg-primary/5 border-b border-primary/10 pt-24 md:pt-28 pb-6 md:pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">
              Welcome, {studentProfile.first_name}!
            </h1>
          </div>
          {studentProfile.student_number && (
            <p className="text-sm text-muted-foreground ml-12">
              Student ID: <span className="font-semibold text-foreground">{studentProfile.student_number}</span>
            </p>
          )}
          <p className="text-muted-foreground ml-12">
            View your grades, resources, and announcements below.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-6 md:mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content — Grades */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grades Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle>My Report Cards</CardTitle>
                      <CardDescription>Your grades across all semesters</CardDescription>
                    </div>
                  </div>
                  {sortedSemesters.length > 1 && (
                    <Select value={activeSemester} onValueChange={setSelectedSemester}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Semesters</SelectItem>
                        {sortedSemesters.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {gradesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : grades.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No grades available yet. Check back after your report cards are published.</p>
                  </div>
                ) : (
                  displayOrder.map((semester) => {
                    const semGrades = gradesBySemester[semester];
                    return (
                      <div key={semester} className="mb-6 last:mb-0">
                        <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                          <Badge variant="outline">{semester}</Badge>
                        </h3>
                        <div>
                          {/* Mobile card view */}
                          <div className="block md:hidden space-y-3 p-3">
                            {semGrades.map((g) => (
                              <div key={g.id} className="border border-border rounded-lg p-3 space-y-2">
                                <p className="font-semibold text-sm text-secondary">{g.class_name}</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                  <span className="text-muted-foreground">Attitude</span>
                                  <span>{g.attitude || '—'}</span>
                                  <span className="text-muted-foreground">Homework</span>
                                  <span>{g.homework || '—'}</span>
                                  <span className="text-muted-foreground">Participation</span>
                                  <span>{g.participation || '—'}</span>
                                  <span className="text-muted-foreground">Test/Quiz</span>
                                  <span>{g.test_quiz || '—'}</span>
                                </div>
                                {g.comments && (
                                  <div className="text-xs text-muted-foreground border-t border-border pt-2">
                                    <ExpandableComment text={g.comments} />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          {/* Desktop table view */}
                          <div className="hidden md:block rounded-md border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Class</TableHead>
                                  <TableHead>Attitude</TableHead>
                                  <TableHead>Homework</TableHead>
                                  <TableHead>Participation</TableHead>
                                  <TableHead>Test/Quiz</TableHead>
                                  <TableHead>Comments</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {semGrades.map((g) => (
                                  <TableRow key={g.id}>
                                    <TableCell className="font-medium">{g.class_name}</TableCell>
                                    <TableCell>{g.attitude || '—'}</TableCell>
                                    <TableCell>{g.homework || '—'}</TableCell>
                                    <TableCell>{g.participation || '—'}</TableCell>
                                    <TableCell>{g.test_quiz || '—'}</TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                                      <ExpandableComment text={g.comments || ''} />
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar — Resources & Announcements */}
          <div className="space-y-6">
            {/* Resources Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10 text-accent">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg">Resources</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Course Catalog */}
                {catalog.catalog_url ? (
                  <a
                    href={catalog.catalog_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Download className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">
                        Course Catalog
                      </p>
                      <p className="text-xs text-muted-foreground">Download PDF</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                ) : (
                  <Link
                    to="/catalog"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
                  >
                    <div className="p-2 rounded-lg bg-accent/10">
                      <FileText className="h-4 w-4 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">
                        Request Course Catalog
                      </p>
                      <p className="text-xs text-muted-foreground">Fill out the request form</p>
                    </div>
                  </Link>
                )}

                {/* SAT Platform Link */}
                <a
                  href="https://prephaus.ditoed.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">
                      SAT Practice Platform
                    </p>
                    <p className="text-xs text-muted-foreground">prephaus.ditoed.com</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </CardContent>
            </Card>

            {/* Announcements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Announcements</CardTitle>
              </CardHeader>
              <CardContent>
                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No announcements at this time.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((a) => (
                      <div key={a.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                        <h4 className="font-medium text-sm text-secondary">{a.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.content}</p>
                        {a.published_at && (
                          <p className="text-xs text-muted-foreground/60 mt-1">
                            {new Date(a.published_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
