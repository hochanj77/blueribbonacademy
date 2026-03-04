import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, GraduationCap, BookOpen, FileText, Download, ExternalLink, Users, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

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

interface Message {
  id: string;
  sender_id: string;
  recipient_id: string | null;
  subject: string;
  content: string;
  read: boolean;
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

const ParentDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading, isParent, isAdminLoading, studentProfile, linkedStudentProfile } = useAuth();
  const [showMessaging, setShowMessaging] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !isAdminLoading) {
      if (!user) navigate('/portal');
      else if (!isParent) navigate('/portal');
    }
  }, [user, loading, isParent, isAdminLoading, navigate]);

  const studentId = linkedStudentProfile?.id;

  // Fetch linked student's grades
  const { data: grades = [], isLoading: gradesLoading } = useQuery({
    queryKey: ['parent_child_grades', studentId],
    queryFn: async () => {
      if (!studentId) return [];
      const { data, error } = await supabase
        .from('student_grades')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudentGrade[];
    },
    enabled: !!studentId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['parent_messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as Message[];
    },
    enabled: !!user?.id,
  });

  // Realtime messages
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('parent-messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${user.id}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['parent_messages', user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !newSubject.trim() || !user?.id) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        sender_id: user.id,
        recipient_id: null, // null = to admin
        subject: newSubject.trim(),
        content: newMessage.trim(),
      });
      if (error) throw error;
      setNewSubject('');
      setNewMessage('');
      toast.success('Message sent to admin');
    } catch {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Catalog info
  const { data: catalogData } = useSiteContent('global', 'catalog');
  const catalog = catalogData?.content || {};

  // Compute sorted semesters and default to most recent
  const sortedSemesters = useMemo(() => {
    const unique = [...new Set(grades.map(g => g.semester).filter(Boolean))];
    return sortSemestersChronologically(unique);
  }, [grades]);

  useEffect(() => {
    if (sortedSemesters.length > 0 && selectedSemester === null) {
      setSelectedSemester(sortedSemesters[sortedSemesters.length - 1]);
    }
  }, [sortedSemesters, selectedSemester]);

  const activeSemester = selectedSemester || 'all';

  const gradesBySemester: Record<string, StudentGrade[]> = {};
  const filteredGrades = activeSemester === 'all' ? grades : grades.filter(g => g.semester === activeSemester);
  filteredGrades.forEach((g) => {
    const key = g.semester || 'Other';
    if (!gradesBySemester[key]) gradesBySemester[key] = [];
    gradesBySemester[key].push(g);
  });

  const sortedSemesterKeys = sortSemestersChronologically(Object.keys(gradesBySemester));

  if (loading || isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isParent || !studentProfile) return null;

  return (
    <div className="pt-24 md:pt-28 pb-10 md:pb-16">
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 sm:p-2 rounded-full bg-accent/10">
              <Users className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary">
              Welcome, {studentProfile.first_name}!
            </h1>
          </div>
          {linkedStudentProfile ? (
            <p className="text-muted-foreground ml-12">
              Viewing dashboard for <span className="font-semibold text-foreground">
                {linkedStudentProfile.first_name} {linkedStudentProfile.last_name}
              </span>
              {linkedStudentProfile.student_number && (
                <span className="text-sm"> (ID: {linkedStudentProfile.student_number})</span>
              )}
            </p>
          ) : (
            <p className="text-muted-foreground ml-12">
              Your account is not yet linked to a student. Please contact PrepHaus administration.
            </p>
          )}
        </div>

        {showMessaging ? (
          <div className="max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-4 gap-2" onClick={() => setShowMessaging(false)}>
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Button>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Messages with Admin
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Message History */}
                <div className="max-h-[400px] overflow-y-auto space-y-3 mb-6 p-3 border border-border rounded-lg bg-muted/30">
                  {messagesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start a conversation below.</p>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.sender_id === user?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-lg p-3 ${
                            isMine ? 'bg-accent/10 border border-accent/20' : 'bg-background border border-border'
                          }`}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {isMine ? 'You' : 'Admin'} · {new Date(msg.created_at).toLocaleString()}
                            </p>
                            <p className="text-xs font-semibold text-secondary">{msg.subject}</p>
                            <p className="text-sm text-foreground mt-1">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Compose */}
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-foreground">Subject</Label>
                    <Input
                      placeholder="Message subject"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-foreground">Message</Label>
                    <Textarea
                      placeholder="Type your message..."
                      rows={3}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="accent"
                    className="w-full gap-2"
                    onClick={handleSendMessage}
                    disabled={sending || !newSubject.trim() || !newMessage.trim()}
                  >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Main Content — Grades */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <GraduationCap className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle>
                          {linkedStudentProfile
                            ? `${linkedStudentProfile.first_name}'s Report Cards`
                            : 'Report Cards'}
                        </CardTitle>
                        <CardDescription>Grades across all semesters</CardDescription>
                      </div>
                    </div>
                    {sortedSemesters.length > 0 && (
                      <Select value={activeSemester} onValueChange={setSelectedSemester}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Filter semester" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Semesters</SelectItem>
                          {sortedSemesters.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!linkedStudentProfile ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p>No student linked. Contact admin to link your account.</p>
                    </div>
                  ) : gradesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : grades.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-10 w-10 mx-auto mb-3 opacity-40" />
                      <p>No grades available yet.</p>
                    </div>
                  ) : (
                    sortedSemesterKeys.map((semester) => {
                      const semGrades = gradesBySemester[semester];
                      return (
                      <div key={semester} className="mb-6 last:mb-0">
                        <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
                          <Badge variant="outline">{semester}</Badge>
                        </h3>
                        {/* Mobile */}
                        <div className="block md:hidden space-y-3 p-3">
                          {semGrades.map((g) => (
                            <div key={g.id} className="border border-border rounded-lg p-3 space-y-2">
                              <p className="font-semibold text-sm text-secondary">{g.class_name}</p>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                <span className="text-muted-foreground">Attitude</span><span>{g.attitude || '—'}</span>
                                <span className="text-muted-foreground">Homework</span><span>{g.homework || '—'}</span>
                                <span className="text-muted-foreground">Participation</span><span>{g.participation || '—'}</span>
                                <span className="text-muted-foreground">Test/Quiz</span><span>{g.test_quiz || '—'}</span>
                              </div>
                              {g.comments && <p className="text-xs text-muted-foreground border-t border-border pt-2">{g.comments}</p>}
                            </div>
                          ))}
                        </div>
                        {/* Desktop */}
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
                                  <TableCell className="text-sm text-muted-foreground max-w-[200px]">{g.comments || '—'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Message Admin */}
              <Card className="cursor-pointer hover:border-accent/50 transition-colors" onClick={() => setShowMessaging(true)}>
                <CardContent className="flex items-center gap-3 py-6">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-secondary">Message Admin</p>
                    <p className="text-xs text-muted-foreground">Send a message to PrepHaus</p>
                  </div>
                  {messages.filter(m => m.recipient_id === user?.id && !m.read).length > 0 && (
                    <Badge className="ml-auto">{messages.filter(m => m.recipient_id === user?.id && !m.read).length}</Badge>
                  )}
                </CardContent>
              </Card>

              {/* Resources */}
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
                  {catalog.catalog_url ? (
                    <a href={catalog.catalog_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group">
                      <div className="p-2 rounded-lg bg-accent/10"><Download className="h-4 w-4 text-accent" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">Course Catalog</p>
                        <p className="text-xs text-muted-foreground">Download PDF</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                  ) : (
                    <a href="/catalog" className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group">
                      <div className="p-2 rounded-lg bg-accent/10"><FileText className="h-4 w-4 text-accent" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">Request Course Catalog</p>
                        <p className="text-xs text-muted-foreground">Fill out the request form</p>
                      </div>
                    </a>
                  )}
                  <a href="https://prephaus.ditoed.com" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted transition-colors group">
                    <div className="p-2 rounded-lg bg-primary/10"><BookOpen className="h-4 w-4 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-secondary group-hover:text-accent transition-colors">SAT Practice Platform</p>
                      <p className="text-xs text-muted-foreground">prephaus.ditoed.com</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </a>
                </CardContent>
              </Card>

              {/* Announcements */}
              <AnnouncementsCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function AnnouncementsCard() {
  const { data: announcements = [] } = useQuery({
    queryKey: ['parent_announcements'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Announcements</CardTitle></CardHeader>
      <CardContent>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No announcements at this time.</p>
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
  );
}

export default ParentDashboard;
