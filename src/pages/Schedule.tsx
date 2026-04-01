import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin } from "lucide-react";
import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";
import { usePageContent } from "@/hooks/useSiteContent";
import { cn } from "@/lib/utils";

const heroDefaults = {
  headline: "Class",
  accent: "Schedule",
  subheading: "Find the right class and time that fits your schedule. Contact us for availability.",
};

interface ClassEntry {
  subject: string;
  day: string;
  time: string;
  details: string;
}

interface ScheduleGroup {
  campus: string;
  category: string;
  entries: ClassEntry[];
}

// Hardcoded fallback data
const defaultGroups: ScheduleGroup[] = [
  {
    campus: 'Cresskill', category: 'Digital SAT Prep',
    entries: [
      { subject: 'Digital SAT Test Prep', day: 'Sat', time: '9:00 am - 3:30 pm', details: '9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break' },
      { subject: 'Digital SAT Lecture', day: 'Sat', time: '9:00 pm - 3:30 pm', details: '12:00 pm - 1:00 pm Lunch break' },
    ],
  },
  {
    campus: 'Cresskill', category: 'Math Analysis',
    entries: [
      { subject: 'Pre-Math Analysis', day: 'Tues', time: '4:30 pm - 6:00 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Math Analysis IA', day: 'Mon & Wed', time: '3:45 pm - 5:00 pm', details: 'Lecture 75 min, Test 30 min after' },
      { subject: 'Math Analysis IB', day: 'Mon', time: '6:15 pm - 7:30 pm', details: 'Lecture 75 min, Test 30 min before' },
      { subject: 'Math Analysis II', day: 'Mon & Wed', time: '4:15 pm - 5:30 pm', details: 'Lecture 75 min' },
      { subject: 'Math Analysis III', day: 'Mon', time: '3:45 pm - 5:15 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Math Analysis IV', day: 'Mon & Thur', time: '7:00 pm - 8:30 pm', details: 'Lecture 1.5 hrs' },
    ],
  },
  {
    campus: 'Cresskill', category: 'Literacy',
    entries: [
      { subject: 'Pre-Literacy', day: 'Tue', time: '3:45 pm - 5:15 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy I', day: 'Tue', time: '5:30 pm - 7:00 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy IIA', day: 'Thur', time: '6:15 pm - 7:45 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy IIB', day: 'Fri', time: '4:00 pm - 5:30 pm', details: 'Lecture 1.5 hrs' },
      { subject: 'Literacy III', day: 'Thur', time: '3:45 pm - 5:15 pm', details: 'Lecture 75 min' },
    ],
  },
  {
    campus: 'Cresskill', category: 'Math (Core)',
    entries: [
      { subject: 'Algebra I', day: 'Sat', time: '9:30 am - 11:30 am', details: 'Lecture 2 hrs' },
      { subject: 'Algebra II', day: 'Wed', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Geometry', day: 'Mon', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Precalculus', day: 'Mon', time: '6:30 pm - 8:30 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Cresskill', category: 'AP & Science',
    entries: [
      { subject: 'AP Chemistry', day: 'Tue', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Physics', day: 'Thur', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Calculus', day: 'Tue', time: '6:30 pm - 9:00 pm', details: 'Lecture 2.5 hrs' },
      { subject: 'AP Biology', day: 'Tue', time: '6:00 pm - 8:30 pm', details: 'Lecture 2.5 hrs' },
      { subject: 'Biology', day: 'Mon', time: '5:30 pm - 7:30 pm', details: 'Lecture 2 hrs' },
      { subject: 'Chemistry', day: 'Wed', time: '7:00 pm - 9:00 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Fort Lee', category: 'Math',
    entries: [
      { subject: 'Geometry', day: 'n/a', time: 'n/a', details: 'n/a' },
      { subject: 'Algebra I', day: 'n/a', time: 'n/a', details: 'n/a' },
      { subject: 'Algebra II', day: 'Tues', time: '4:00 pm - 6:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'Precalculus (HL/SL I)', day: 'Wed', time: '6:00 pm - 8:00 pm', details: 'Lecture 2 hrs' },
      { subject: 'AP Calculus (HL/SL II)', day: 'Wed', time: '4:00 pm - 6:00 pm', details: 'Lecture 2 hrs' },
    ],
  },
  {
    campus: 'Fort Lee', category: 'Digital SAT Prep',
    entries: [
      { subject: 'Digital SAT Test Prep', day: 'Sat', time: '9:00 am - 3:30 pm', details: '9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break' },
    ],
  },
];

function useScheduleGroups() {
  return useQuery({
    queryKey: ['site_content', 'schedule_data', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_content')
        .select('*')
        .eq('page', 'schedule_data')
        .eq('section_key', 'all')
        .maybeSingle();
      if (error) throw error;
      if (data?.content) {
        try {
          const content = data.content as Record<string, string>;
          if (content.groups_json) {
            return JSON.parse(content.groups_json) as ScheduleGroup[];
          }
        } catch {
          // fall through
        }
      }
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });
}

interface ScheduleTableProps {
  entries: ClassEntry[];
}

function ScheduleTable({ entries }: ScheduleTableProps) {
  return (
    <>
      <div className="hidden md:block rounded-2xl border border-border/40 overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/90 border-none">
              <TableHead className="text-secondary-foreground font-bold text-sm py-4">Subject</TableHead>
              <TableHead className="text-secondary-foreground font-bold text-sm py-4">Day</TableHead>
              <TableHead className="text-secondary-foreground font-bold text-sm py-4">Time</TableHead>
              <TableHead className="text-secondary-foreground font-bold text-sm py-4">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={i} className={cn(
                "transition-colors hover:bg-accent/5",
                i % 2 === 0 ? "bg-card" : "bg-muted/30"
              )}>
                <TableCell className="font-semibold text-foreground py-4">{e.subject}</TableCell>
                <TableCell className="text-muted-foreground py-4">{e.day}</TableCell>
                <TableCell className="text-muted-foreground py-4">{e.time}</TableCell>
                <TableCell className="text-muted-foreground text-sm py-4">{e.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="rounded-xl border border-border/40 bg-card p-4 space-y-2 shadow-sm border-t-2 border-t-accent/60">
            <p className="font-bold text-foreground">{e.subject}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-muted-foreground font-medium">Day</span>
              <span className="text-foreground">{e.day}</span>
              <span className="text-muted-foreground font-medium">Time</span>
              <span className="text-foreground">{e.time}</span>
              <span className="text-muted-foreground font-medium">Details</span>
              <span className="text-foreground">{e.details}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default function Schedule() {
  const { data: pageContent } = usePageContent("schedule");
  const { data: cmsGroups } = useScheduleGroups();
  const hero = { ...heroDefaults, ...pageContent?.hero };

  const groups = cmsGroups || defaultGroups;
  const campuses = [...new Set(groups.map(g => g.campus))];

  const cresskillSection = useInView();
  const fortLeeSection = useInView();
  const sectionRefs = [cresskillSection, fortLeeSection];

  return (
    <div>
      <PageHero
        title={hero.headline}
        accent={hero.accent}
        subtitle={hero.subheading}
      />

      {campuses.map((campus, campusIdx) => {
        const campusGroups = groups.filter(g => g.campus === campus);
        const sectionRef = sectionRefs[campusIdx] || cresskillSection;
        const isEven = campusIdx % 2 === 0;

        return (
          <section
            key={campus}
            className={cn("py-12 md:py-20", isEven ? "bg-background" : "bg-muted")}
            ref={sectionRef.ref}
          >
            <div className="container mx-auto px-4 space-y-10">
              <div className={cn(
                "flex items-center gap-3 transition-all duration-700",
                sectionRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}>
                <div className="p-2.5 rounded-xl bg-accent/10">
                  <MapPin className="h-5 w-5 text-accent" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">{campus} Campus</h2>
              </div>

              {campusGroups.map((group, i) => (
                <div key={`${campus}-${group.category}`} className={cn(
                  "space-y-4 transition-all duration-700",
                  sectionRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )} style={{ transitionDelay: `${(i + 1) * 100}ms` }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-1 h-6 rounded-full bg-accent" />
                    <Clock className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-bold text-foreground">{group.category}</h3>
                  </div>
                  <ScheduleTable entries={group.entries} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
