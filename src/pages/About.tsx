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

    </div>
  );
}
