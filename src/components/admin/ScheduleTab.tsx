import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Edit, Loader2, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';

interface Schedule {
  id: string;
  title: string;
  description: string | null;
  course_id: string | null;
  start_time: string;
  end_time: string;
  recurring: boolean;
  recurrence_rule: string | null;
  location: string | null;
}

interface Course {
  id: string;
  name: string;
}

const ScheduleTab = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const queryClient = useQueryClient();

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: schedules = [], isLoading } = useQuery({
    queryKey: ['schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*')
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as Schedule[];
    },
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name')
        .eq('active', true);
      if (error) throw error;
      return data as Course[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('class_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
      toast.success('Class deleted successfully');
    },
  });

  const getSchedulesForDay = (day: Date) => {
    return schedules.filter((schedule) => {
      const scheduleDate = parseISO(schedule.start_time);
      return isSameDay(scheduleDate, day);
    });
  };

  const getCourseName = (courseId: string | null) => {
    if (!courseId) return null;
    return courses.find((c) => c.id === courseId)?.name;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Class Schedule</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <ScheduleForm
              courses={courses}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['schedules'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="week" className="space-y-4">
          <TabsList>
            <TabsTrigger value="week">Week View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="week">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
                Previous Week
              </Button>
              <h3 className="font-medium">
                {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
              </h3>
              <Button variant="outline" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
                Next Week
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day) => (
                  <div key={day.toISOString()} className="min-h-[200px]">
                    <div className="text-center p-2 bg-muted rounded-t-md">
                      <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                      <div className="font-medium">{format(day, 'd')}</div>
                    </div>
                    <div className="border border-t-0 rounded-b-md p-1 space-y-1 min-h-[160px]">
                      {getSchedulesForDay(day).map((schedule) => (
                        <div
                          key={schedule.id}
                          className="bg-primary/10 rounded p-2 text-xs cursor-pointer hover:bg-primary/20"
                          onClick={() => setEditingSchedule(schedule)}
                        >
                          <div className="font-medium truncate">{schedule.title}</div>
                          <div className="text-muted-foreground">
                            {format(parseISO(schedule.start_time), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="list">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : schedules.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No classes scheduled</p>
            ) : (
              <div className="space-y-3">
                {schedules.map((schedule) => (
                  <Card key={schedule.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h4 className="font-medium">{schedule.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="h-4 w-4" />
                              {format(parseISO(schedule.start_time), 'MMM d, yyyy')}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {format(parseISO(schedule.start_time), 'h:mm a')} -{' '}
                              {format(parseISO(schedule.end_time), 'h:mm a')}
                            </span>
                            {schedule.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                {schedule.location}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2 mt-2">
                            {getCourseName(schedule.course_id) && (
                              <Badge variant="outline">{getCourseName(schedule.course_id)}</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingSchedule(schedule)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(schedule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            {editingSchedule && (
              <ScheduleForm
                schedule={editingSchedule}
                courses={courses}
                onSuccess={() => {
                  setEditingSchedule(null);
                  queryClient.invalidateQueries({ queryKey: ['schedules'] });
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

interface ScheduleFormProps {
  schedule?: Schedule;
  courses: Course[];
  onSuccess: () => void;
}

const ScheduleForm = ({ schedule, courses, onSuccess }: ScheduleFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: schedule?.title || '',
    description: schedule?.description || '',
    course_id: schedule?.course_id || '',
    start_date: schedule ? format(parseISO(schedule.start_time), 'yyyy-MM-dd') : '',
    start_time: schedule ? format(parseISO(schedule.start_time), 'HH:mm') : '',
    end_time: schedule ? format(parseISO(schedule.end_time), 'HH:mm') : '',
    location: schedule?.location || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const startDateTime = `${formData.start_date}T${formData.start_time}:00`;
      const endDateTime = `${formData.start_date}T${formData.end_time}:00`;

      const dataToSubmit = {
        title: formData.title,
        description: formData.description || null,
        course_id: formData.course_id || null,
        start_time: startDateTime,
        end_time: endDateTime,
        location: formData.location || null,
      };

      if (schedule) {
        const { error } = await supabase
          .from('class_schedules')
          .update(dataToSubmit)
          .eq('id', schedule.id);
        if (error) throw error;
        toast.success('Class updated successfully');
      } else {
        const { error } = await supabase.from('class_schedules').insert(dataToSubmit);
        if (error) throw error;
        toast.success('Class added successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save class');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course_id">Course</Label>
        <Select
          value={formData.course_id}
          onValueChange={(value) => setFormData({ ...formData, course_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">None</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Date *</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start Time *</Label>
          <Input
            id="start_time"
            type="time"
            value={formData.start_time}
            onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="end_time">End Time *</Label>
          <Input
            id="end_time"
            type="time"
            value={formData.end_time}
            onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., Room 101, Online"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {schedule ? 'Update Class' : 'Add Class'}
        </Button>
      </div>
    </form>
  );
};

export default ScheduleTab;
