import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { usePageContent } from "@/hooks/useSiteContent";
import { useInView } from "@/hooks/useInView";
import { Heart, BookOpen, Target, Users } from "lucide-react";

const defaults = {
  welcome: {
    headline: "Welcome to Blue Ribbon Academy",
    intro: "We believe all students have the right to receive a good education.",
    body: "With over 20 years of experience, we've learned that good education is impossible without sharing life together with the students. We do not perceive our students merely as attendants of our academy but more as disciples we nurture through our lives. We make sure to treat all students with much care with this mission in mind.",
  },
};

const values = [
  {
    icon: Heart,
    title: "Character First",
    desc: "Education starts with who you are — not just what you know.",
    accent: "border-l-rose-400",
    iconBg: "bg-rose-50",
    iconColor: "text-rose-500",
  },
  {
    icon: BookOpen,
    title: "20+ Years of Excellence",
    desc: "Two decades of walking alongside students on their way to top universities.",
    accent: "border-l-accent",
    iconBg: "bg-amber-50",
    iconColor: "text-accent",
  },
  {
    icon: Target,
    title: "Personalized Approach",
    desc: "No two students learn the same way. We pay attention to the details.",
    accent: "border-l-primary",
    iconBg: "bg-blue-50",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "Students, parents, and educators — growing together as family.",
    accent: "border-l-emerald-400",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
];

export default function About() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: pageContent } = usePageContent("about");
  const welcome = { ...defaults.welcome, ...pageContent?.welcome };
  const cards = useInView();

  return (
    <div className="pt-24 md:pt-28">
      {/* Welcome Section */}
      <section className="py-16 md:py-24 bg-background overflow-hidden">
        <div className="container mx-auto px-4">
          <div
            className={cn(
              "grid lg:grid-cols-2 gap-10 md:gap-16 items-center transition-all duration-1000 ease-out",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-px w-12 bg-accent" />
                <span className="text-accent text-sm font-semibold tracking-widest uppercase">About Us</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight tracking-tight">
                {welcome.headline}
              </h1>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                <p className="text-lg md:text-xl font-semibold text-foreground">
                  {welcome.intro}
                </p>
                <p>{welcome.body}</p>
              </div>
            </div>

            {/* Interactive Values Card Grid */}
            <div ref={cards.ref} className="space-y-4">
              {values.map((v, i) => (
                <div
                  key={v.title}
                  className={cn(
                    "group flex items-start gap-5 bg-card border border-border/60 border-l-4 rounded-xl px-6 py-5 hover:shadow-md transition-all duration-500 cursor-default",
                    v.accent,
                    cards.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                  )}
                  style={{ transitionDelay: `${(i + 1) * 100}ms` }}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center mt-0.5", v.iconBg)}>
                    <v.icon className={cn("h-5 w-5", v.iconColor)} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">{v.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
