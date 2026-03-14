import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Lightbulb, Shield, Heart, Users, BookOpen, Award } from "lucide-react";
import classroomImage from "@/assets/classroom.jpg";
import { cn } from "@/lib/utils";
import { usePageContent } from "@/hooks/useSiteContent";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1500;
    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const values = [
  {
    icon: Lightbulb,
    title: "Curiosity & Self-Belief",
    description: "To see themselves as capable of anything.",
    color: "from-primary/20 to-accent/20",
  },
  {
    icon: Shield,
    title: "Discipline & Resilience",
    description: "To tackle challenges with a steady hand.",
    color: "from-accent/20 to-primary/20",
  },
  {
    icon: Heart,
    title: "Character & Purpose",
    description: "To ensure their success is built on a solid foundation.",
    color: "from-primary/20 to-accent/20",
  },
];

const stats = [
  { icon: Users, value: 5000, suffix: "+", label: "Students Mentored" },
  { icon: BookOpen, value: 50, suffix: "+", label: "Years Combined Experience" },
  { icon: Award, value: 99, suffix: "%", label: "Student Satisfaction" },
];

const defaults = {
  welcome: {
    headline: "Welcome to Blue Ribbon Academy",
    intro: "We believe all students have the right to receive a good education.",
    body: "With over 20 years of experience, we've learned that good education is impossible without sharing life together with the students. We do not perceive our students merely as attendants of our academy but more as disciples we nurture through our lives. We make sure to treat all students with much care with this mission in mind.",
  },
  belonging: {
    headline: "The Power of Belonging",
    body: "Our name is our philosophy. Derived from the German Haus, it implies far more than just a building or a classroom. It signifies home, belonging, and a shared life. We've traded the cold, assembly-line feel of traditional test prep for a warm, welcoming environment—a place where students feel at home with teachers who genuinely know them, believe in them, and challenge them to grow.",
  },
  heart: {
    headline: "The Heart Behind the Knowledge",
    body: "While many see education as a transactional transfer of facts, we strive to be more than mere vessels for knowledge. We believe education is not the end goal, but the vital process that helps students reach their dreams. Our teachers are mentors who care deeply, not just for your score growth, but for your personal potential.",
    values_intro: "At PrepHaus, we work intentionally, every step of the way, to help students develop:",
  },
  excellence: {
    headline: "Built for Excellence. Anchored in Community.",
    body: "In this Haus, we never mistake warmth for weakness. We are uncompromising when it comes to academic rigor. Our standards are elite, and we never sacrifice performance for comfort. Instead, we use our community as the fuel for high achievement, believing that students reach their peak when they are challenged within a place they truly belong.",
    quote: "We are a community growing together, leaving no regrets as we build the academic prowess and inner grit needed for a secure future. At PrepHaus, we don't just help you reach a goal; we give you the momentum to surpass it.",
  },
};

export default function About() {
  const [mounted, setMounted] = useState(false);
  const belongingView = useInView();
  const heartView = useInView();
  const excellenceView = useInView();
  const statsSection = useInView();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: pageContent } = usePageContent("about");
  const welcome = { ...defaults.welcome, ...pageContent?.welcome };
  const belonging = { ...defaults.belonging, ...pageContent?.belonging };
  const heart = { ...defaults.heart, ...pageContent?.heart };
  const excellence = { ...defaults.excellence, ...pageContent?.excellence };

  return (
    <div className="pt-20 md:pt-24">

      {/* Welcome Section */}
      <section className="py-10 md:py-16 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div
            className={cn(
              "grid lg:grid-cols-2 gap-8 md:gap-12 items-center transition-all duration-1000 ease-out",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <div>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-secondary mb-4 md:mb-6 leading-tight">
                {welcome.headline}
              </h1>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
                <p className="text-base md:text-lg font-semibold text-foreground">
                  {welcome.intro}
                </p>
                <p>{welcome.body}</p>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <img
                src={classroomImage}
                alt="PrepHaus learning environment"
                className="rounded-2xl shadow-2xl relative z-10 transition-transform duration-300 ease-out group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 md:py-12 bg-secondary" ref={statsSection.ref}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "text-center transition-all duration-700",
                  statsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <stat.icon className="h-6 w-6 md:h-8 md:w-8 text-accent mx-auto mb-2" />
                <div className="text-2xl md:text-4xl font-bold text-secondary-foreground">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs md:text-sm text-secondary-foreground/70 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Power of Belonging */}
      <section className="py-8 md:py-16 bg-muted overflow-hidden">
        <div className="container mx-auto px-4">
          <div
            ref={belongingView.ref}
            className={cn(
              "max-w-3xl mx-auto transition-all duration-700",
              belongingView.inView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-8"
            )}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-4 md:mb-6">
              {belonging.headline}
            </h2>
            <div className="text-muted-foreground leading-relaxed text-sm md:text-base">
              <p>{belonging.body}</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Heart Behind the Knowledge */}
      <section className="py-8 md:py-16 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div
            ref={heartView.ref}
            className={cn(
              "max-w-3xl mx-auto transition-all duration-700",
              heartView.inView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
            )}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-4 md:mb-6">
              {heart.headline}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
              <p>{heart.body}</p>
              <p className="font-medium text-foreground">{heart.values_intro}</p>
            </div>
          </div>

          {/* Value Cards */}
          <div className="max-w-3xl mx-auto mt-8 grid md:grid-cols-3 gap-4 md:gap-6">
            {values.map((val, i) => (
              <div
                key={val.title}
                className={cn(
                  "group relative bg-card rounded-xl p-5 md:p-6 border border-border shadow-sm cursor-default transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:border-accent/50",
                  heartView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${(i + 1) * 200}ms` }}
              >
                <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", val.color)} />
                <div className="relative z-10">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors duration-300">
                    <val.icon className="h-5 w-5 md:h-6 md:w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-secondary text-sm md:text-base mb-1">{val.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Excellence */}
      <section className="py-8 md:py-16 bg-muted overflow-hidden">
        <div className="container mx-auto px-4">
          <div
            ref={excellenceView.ref}
            className={cn(
              "max-w-3xl mx-auto transition-all duration-700",
              excellenceView.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-4 md:mb-6">
              {excellence.headline}
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed text-sm md:text-base">
              <p>{excellence.body}</p>
              <p className="text-foreground font-medium border-l-4 border-accent pl-4 py-2 bg-accent/5 rounded-r-lg">
                {excellence.quote}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

