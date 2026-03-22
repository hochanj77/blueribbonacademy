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
    desc: "We nurture integrity, resilience, and empathy alongside academics.",
    color: "from-rose-500/20 to-rose-500/5",
    iconColor: "text-rose-500",
  },
  {
    icon: BookOpen,
    title: "20+ Years of Excellence",
    desc: "Two decades of proven results helping students reach top universities.",
    color: "from-accent/20 to-accent/5",
    iconColor: "text-accent",
  },
  {
    icon: Target,
    title: "Personalized Approach",
    desc: "Tailored instruction that meets every student where they are.",
    color: "from-primary/20 to-primary/5",
    iconColor: "text-primary",
  },
  {
    icon: Users,
    title: "Community Driven",
    desc: "A tight-knit family of students, parents, and educators growing together.",
    color: "from-emerald-500/20 to-emerald-500/5",
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
            <div ref={cards.ref} className="grid grid-cols-2 gap-4">
              {values.map((v, i) => (
                <div
                  key={v.title}
                  className={cn(
                    "group relative bg-card border border-border rounded-2xl p-6 hover:border-accent/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-default overflow-hidden",
                    cards.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                  )}
                  style={{ transitionDelay: `${(i + 1) * 120}ms` }}
                >
                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500", v.color)} />
                  <div className="relative z-10">
                    <div className={cn("w-12 h-12 rounded-xl bg-muted group-hover:scale-110 flex items-center justify-center mb-4 transition-transform duration-300")}>
                      <v.icon className={cn("h-6 w-6", v.iconColor)} />
                    </div>
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{v.title}</h3>
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
