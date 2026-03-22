import { useEffect, useState } from "react";
import classroomImage from "@/assets/classroom-br.jpg";
import { cn } from "@/lib/utils";
import { usePageContent } from "@/hooks/useSiteContent";
import { useInView } from "@/hooks/useInView";


const defaults = {
  welcome: {
    headline: "Welcome to Blue Ribbon Academy",
    intro: "We believe all students have the right to receive a good education.",
    body: "With over 20 years of experience, we've learned that good education is impossible without sharing life together with the students. We do not perceive our students merely as attendants of our academy but more as disciples we nurture through our lives. We make sure to treat all students with much care with this mission in mind.",
  },
};

export default function About() {
  const [mounted, setMounted] = useState(false);
  const statsSection = useInView();

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const { data: pageContent } = usePageContent("about");
  const welcome = { ...defaults.welcome, ...pageContent?.welcome };

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
            <div className="relative group">
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/15 via-accent/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/20 rounded-2xl -z-10" />
              <img
                src={classroomImage}
                alt="Blue Ribbon Academy learning environment"
                className="rounded-2xl shadow-2xl relative z-10 transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-secondary via-primary to-secondary relative overflow-hidden" ref={statsSection.ref}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-3 gap-6 md:gap-10">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "text-center transition-all duration-700",
                  statsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-primary-foreground/10 mb-3">
                  <stat.icon className="h-6 w-6 md:h-7 md:w-7 text-accent" />
                </div>
                <div className="text-3xl md:text-5xl font-extrabold text-primary-foreground tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs md:text-sm text-primary-foreground/60 mt-1 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
