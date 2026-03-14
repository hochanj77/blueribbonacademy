import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin } from "lucide-react";

interface ClassEntry {
  subject: string;
  day: string;
  time: string;
  details: string;
}

const satPrep: ClassEntry[] = [
  { subject: "Digital SAT Test Prep", day: "Sat", time: "9:00 am - 3:30 pm", details: "9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break" },
  { subject: "Digital SAT Lecture", day: "Sat", time: "9:00 pm - 3:30 pm", details: "12:00 pm - 1:00 pm Lunch break" },
];

const mathAnalysis: ClassEntry[] = [
  { subject: "Pre-Math Analysis", day: "Tues", time: "4:30 pm - 6:00 pm", details: "Lecture 1.5 hrs" },
  { subject: "Math Analysis IA", day: "Mon & Wed", time: "3:45 pm - 5:00 pm", details: "Lecture 75 min, Test 30 min after" },
  { subject: "Math Analysis IB", day: "Mon", time: "6:15 pm - 7:30 pm", details: "Lecture 75 min, Test 30 min before" },
  { subject: "Math Analysis II", day: "Mon & Wed", time: "4:15 pm - 5:30 pm", details: "Lecture 75 min" },
  { subject: "Math Analysis III", day: "Mon", time: "3:45 pm - 5:15 pm", details: "Lecture 1.5 hrs" },
  { subject: "Math Analysis IV", day: "Mon & Thur", time: "7:00 pm - 8:30 pm", details: "Lecture 1.5 hrs" },
];

const literacy: ClassEntry[] = [
  { subject: "Pre-Literacy", day: "Tue", time: "3:45 pm - 5:15 pm", details: "Lecture 1.5 hrs" },
  { subject: "Literacy I", day: "Tue", time: "5:30 pm - 7:00 pm", details: "Lecture 1.5 hrs" },
  { subject: "Literacy IIA", day: "Thur", time: "6:15 pm - 7:45 pm", details: "Lecture 1.5 hrs" },
  { subject: "Literacy IIB", day: "Fri", time: "4:00 pm - 5:30 pm", details: "Lecture 1.5 hrs" },
  { subject: "Literacy III", day: "Thur", time: "3:45 pm - 5:15 pm", details: "Lecture 75 min" },
];

const mathCore: ClassEntry[] = [
  { subject: "Algebra I", day: "Sat", time: "9:30 am - 11:30 am", details: "Lecture 2 hrs" },
  { subject: "Algebra II", day: "Wed", time: "5:30 pm - 7:30 pm", details: "Lecture 2 hrs" },
  { subject: "Geometry", day: "Mon", time: "5:30 pm - 7:30 pm", details: "Lecture 2 hrs" },
  { subject: "Precalculus", day: "Mon", time: "6:30 pm - 8:30 pm", details: "Lecture 2 hrs" },
];

const science: ClassEntry[] = [
  { subject: "AP Chemistry", day: "Tue", time: "7:00 pm - 9:00 pm", details: "Lecture 2 hrs" },
  { subject: "AP Physics", day: "Thur", time: "7:00 pm - 9:00 pm", details: "Lecture 2 hrs" },
  { subject: "AP Calculus", day: "Tue", time: "6:30 pm - 9:00 pm", details: "Lecture 2.5 hrs" },
  { subject: "AP Biology", day: "Tue", time: "6:00 pm - 8:30 pm", details: "Lecture 2.5 hrs" },
  { subject: "Biology", day: "Mon", time: "5:30 pm - 7:30 pm", details: "Lecture 2 hrs" },
  { subject: "Chemistry", day: "Wed", time: "7:00 pm - 9:00 pm", details: "Lecture 2 hrs" },
];

const fortLee: ClassEntry[] = [
  { subject: "Geometry", day: "n/a", time: "n/a", details: "n/a" },
  { subject: "Algebra I", day: "n/a", time: "n/a", details: "n/a" },
  { subject: "Algebra II", day: "Tues", time: "4:00 pm - 6:00 pm", details: "Lecture 2 hrs" },
  { subject: "Precalculus (HL/SL I)", day: "Wed", time: "6:00 pm - 8:00 pm", details: "Lecture 2 hrs" },
  { subject: "AP Calculus (HL/SL II)", day: "Wed", time: "4:00 pm - 6:00 pm", details: "Lecture 2 hrs" },
];

const fortLeeSat: ClassEntry[] = [
  { subject: "Digital SAT Test Prep", day: "Sat", time: "9:00 am - 3:30 pm", details: "9:00 am - 11:30 am Test, 12:00 pm - 1:00 pm Lunch break" },
];

interface ScheduleTableProps {
  entries: ClassEntry[];
}

function ScheduleTable({ entries }: ScheduleTableProps) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary">
              <TableHead className="text-secondary-foreground font-bold">Subject</TableHead>
              <TableHead className="text-secondary-foreground font-bold">Day</TableHead>
              <TableHead className="text-secondary-foreground font-bold">Time</TableHead>
              <TableHead className="text-secondary-foreground font-bold">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((e, i) => (
              <TableRow key={i} className={i % 2 === 0 ? "bg-card" : "bg-muted/50"}>
                <TableCell className="font-medium text-foreground">{e.subject}</TableCell>
                <TableCell className="text-muted-foreground">{e.day}</TableCell>
                <TableCell className="text-muted-foreground">{e.time}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{e.details}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {entries.map((e, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <p className="font-semibold text-secondary">{e.subject}</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <span className="text-muted-foreground">Day</span>
              <span>{e.day}</span>
              <span className="text-muted-foreground">Time</span>
              <span>{e.time}</span>
              <span className="text-muted-foreground">Details</span>
              <span>{e.details}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

const sections = [
  { title: "Digital SAT Prep", data: satPrep },
  { title: "Math Analysis", data: mathAnalysis },
  { title: "Literacy", data: literacy },
  { title: "Math (Core)", data: mathCore },
  { title: "AP & Science", data: science },
];

export default function Schedule() {
  return (
    <div className="pt-20 md:pt-24">
      {/* Hero */}
      <section className="py-10 md:py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-bold text-secondary mb-4">
              Class <span className="text-accent">Schedule</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Find the right class and time that fits your schedule. Contact us for availability.
            </p>
          </div>
        </div>
      </section>

      {/* Cresskill Campus */}
      <section className="py-8 md:py-14 bg-background">
        <div className="container mx-auto px-4 space-y-10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-accent" />
            <h2 className="text-xl md:text-2xl font-bold text-secondary">Cresskill Campus</h2>
          </div>

          {sections.map((section) => (
            <div key={section.title} className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-lg font-bold text-secondary">{section.title}</h3>
              </div>
              <ScheduleTable entries={section.data} />
            </div>
          ))}
        </div>
      </section>

      {/* Fort Lee Campus */}
      <section className="py-8 md:py-14 bg-muted">
        <div className="container mx-auto px-4 space-y-10">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-accent" />
            <h2 className="text-xl md:text-2xl font-bold text-secondary">Fort Lee Campus</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-bold text-secondary">Math</h3>
            </div>
            <ScheduleTable entries={fortLee} />
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="text-lg font-bold text-secondary">Digital SAT Prep</h3>
            </div>
            <ScheduleTable entries={fortLeeSat} />
          </div>
        </div>
      </section>
    </div>
  );
}
