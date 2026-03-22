import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import universityLogos from "@/assets/university-logos.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, CalendarDays, ArrowRight, Quote, ChevronLeft, ChevronRight, GraduationCap, FileText, Users, Lightbulb } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

import { usePageContent } from "@/hooks/useSiteContent";

const heroDefaults = {
  headline: "Where Every Student Can Shine.",
  subheading: "We believe all students have the right to receive a good education. With over 20 years of experience, we strive to help students develop character alongside academic prowess every step of the way.",
  cta_primary_text: "View Programs",
  cta_primary_link: "/courses",
  cta_secondary_text: "Download Course Catalog",
  cta_secondary_link: "/catalog",
};

const ctaDefaults = {
  headline: "Ready to Start Your Journey?",
  subheading: "Contact us today and learn how Blue Ribbon Academy can help you achieve your academic goals.",
  button_text: "Contact Us",
  button_link: "/contact",
};

const testimonials = [
  {
    name: "Regina Lee",
    text: "I started Blue Ribbon Academy 9th grade, doing chemistry. Blue Ribbon Academy especially Christine was always prepared with the necessary resources for me to grow as a learner. I scored great on both exams, and now as a senior, I am heading to UCLA!",
  },
  {
    name: "J. Park",
    text: "AMAZING learning environment! From SAT prep to essays, Blue Ribbon has helped me throughout my high school experience. Blue Ribbon has successfully guided me through my high school years, and because of that, I will now be attending University of Pennsylvania's Class of 2026!",
  },
  {
    name: "Michelle Jo",
    text: "The teachers are extremely well educated and are able to create unique bonds with the students. I was able to successfully reach my SAT goals through Blue Ribbon, as the director definitely played a big role in helping me get into Northwestern!",
  },
  {
    name: "Daniel K.",
    text: "Blue Ribbon Academy's SAT prep program was exactly what I needed. The personalized attention and strategic approach helped me improve my score by over 200 points. I'm now attending Columbia University!",
  },
  {
    name: "Sarah L.",
    text: "The college consulting at Blue Ribbon was invaluable. They helped me craft my personal statement and guided me through every step of the application process. I couldn't have gotten into my dream school without their support.",
  },
];

const consultingHighlights = [
  { icon: Lightbulb, title: "Strategic Planning", desc: "Year-by-year guidance to keep you on track for admissions success." },
  { icon: FileText, title: "Essay Coaching", desc: "Craft a personal statement that authentically tells your story." },
  { icon: Users, title: "Interview Prep", desc: "Practice sessions to build confidence and polish your delivery." },
  { icon: GraduationCap, title: "College Selection", desc: "Find the right-fit schools that match your goals and profile." },
];

function SmartLink({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: any }) {
  if (to.startsWith('http')) {
    return <a href={to} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  }
  return <Link to={to} {...props}>{children}</Link>;
}

function TestimonialCarousel() {
  const [current, setCurrent] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const section = useInView();

  const next = useCallback(() => setCurrent((c) => (c + 1) % testimonials.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length), []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, next]);

  return (
    <section className="py-16 md:py-24 bg-muted" ref={section.ref}>
      <div className="container mx-auto px-4">
        <div className={cn("text-center mb-12 transition-all duration-700", section.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-accent" />
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">Testimonials</span>
            <div className="h-px w-10 bg-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">What Our Students Say</h2>
        </div>

        <div
          className={cn("max-w-3xl mx-auto transition-all duration-700", section.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}
          style={{ transitionDelay: "150ms" }}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          <div className="relative bg-card border border-border rounded-2xl p-8 md:p-12 shadow-lg">
            <Quote className="h-10 w-10 text-accent/20 mb-6" />
            <div className="min-h-[140px] flex items-center">
              <blockquote className="text-muted-foreground text-base md:text-lg leading-relaxed transition-opacity duration-500">
                "{testimonials[current].text}"
              </blockquote>
            </div>
            <div className="border-t border-border pt-5 mt-6">
              <p className="font-semibold text-secondary text-lg">{testimonials[current].name}</p>
              <p className="text-xs text-accent">Blue Ribbon Academy Student</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8">
              <div className="flex gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      i === current ? "w-8 bg-accent" : "w-2 bg-border hover:bg-accent/40"
                    )}
                    aria-label={`Go to testimonial ${i + 1}`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={prev}
                  className="p-2 rounded-full border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors"
                  aria-label="Previous testimonial"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={next}
                  className="p-2 rounded-full border border-border hover:border-accent/50 hover:bg-accent/5 transition-colors"
                  aria-label="Next testimonial"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link to="/testimonials">
              <Button variant="outline" className="rounded-full gap-2 group border-primary/20 hover:border-primary/50">
                Read All Reviews
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollegeConsultingSection() {
  const section = useInView();

  return (
    <section className="py-16 md:py-24 bg-background" ref={section.ref}>
      <div className="container mx-auto px-4">
        <div className={cn("text-center mb-12 transition-all duration-700", section.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6")}>
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="h-px w-10 bg-accent" />
            <span className="text-accent text-sm font-semibold tracking-widest uppercase">Expert Guidance</span>
            <div className="h-px w-10 bg-accent" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">College Consulting</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            From freshman year strategy to senior year applications, our experienced consultants guide students every step of the way to their dream schools.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {consultingHighlights.map((item, i) => (
            <div
              key={item.title}
              className={cn(
                "group bg-card border border-border rounded-2xl p-6 text-center hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-500",
                section.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${(i + 1) * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-accent/20 group-hover:scale-110 flex items-center justify-center mb-5 mx-auto transition-all duration-300">
                <item.icon className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-300" />
              </div>
              <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/college-consulting">
            <Button variant="accent" size="lg" className="rounded-full gap-2 group">
              Learn More
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function Index() {
  const { data: pageContent } = usePageContent("home");
  const hero = { ...heroDefaults, ...pageContent?.hero };
  const cta = { ...ctaDefaults, ...pageContent?.cta_section };

  const { data: announcements = [] } = useQuery({
    queryKey: ['published-announcements'],
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
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <img src={heroBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-secondary/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/40 to-secondary/60" />
        </div>
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl animate-fade-in-up">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-px w-12 bg-accent" />
              <span className="text-accent text-sm font-semibold tracking-widest uppercase">Blue Ribbon Academy</span>
              <div className="h-px w-12 bg-accent" />
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-primary-foreground leading-[1.05] mb-6 tracking-tight">
              {hero.headline}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-lg mx-auto leading-relaxed">
              {hero.subheading}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <SmartLink to={hero.cta_primary_link}>
                <Button variant="accent" size="xl" className="w-full sm:w-auto rounded-full gap-2 group">
                  {hero.cta_primary_text}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </SmartLink>
              <SmartLink to={hero.cta_secondary_link}>
                <Button variant="hero-outline" size="lg" className="w-full sm:w-auto rounded-full border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  {hero.cta_secondary_text}
                </Button>
              </SmartLink>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* University Logo Bar */}
      <section className="py-10 md:py-14 bg-background border-b border-border/30">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs md:text-sm font-semibold tracking-widest uppercase text-muted-foreground/60 mb-8">
            Where Our Students Have Gone
          </p>
          <div className="flex items-center justify-center">
            <img
              src={universityLogos}
              alt="Universities including Illinois, Duke, Google, University of Michigan, IBM, Vanderbilt, Johns Hopkins"
              className="max-w-full h-10 md:h-14 object-contain opacity-70 hover:opacity-100 transition-opacity duration-500"
            />
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-4">
                <Megaphone className="h-4 w-4" />
                Announcements
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">Latest Updates</h2>
              <div className="section-divider mt-4" />
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              {announcements.map((a, i) => (
                <Card key={a.id} className="card-sleek w-full md:max-w-sm lg:max-w-md overflow-hidden" style={{ animationDelay: `${i * 100}ms` }}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse" />
                      <h3 className="font-bold text-lg text-foreground">{a.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 pl-5">{a.content}</p>
                    {a.published_at && (
                      <div className="flex items-center gap-1.5 pl-5 text-muted-foreground/60">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <p className="text-xs font-medium">{format(new Date(a.published_at), 'MMMM d, yyyy')}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* College Consulting Section */}
      <CollegeConsultingSection />

      {/* Testimonials Carousel */}
      <TestimonialCarousel />

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">{cta.headline}</h2>
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto">{cta.subheading}</p>
          <SmartLink to={cta.button_link}>
            <Button variant="accent" size="xl" className="rounded-full gap-2 group">
              {cta.button_text}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </SmartLink>
        </div>
      </section>
    </div>
  );
}
