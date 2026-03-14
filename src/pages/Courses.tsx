import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowRight } from "lucide-react";
import { usePageContent } from "@/hooks/useSiteContent";
import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const defaultPrograms = [
  { name: "SAT Prep", desc: "Comprehensive Digital SAT preparation with practice tests and expert coaching." },
  { name: "ACT Prep", desc: "Strategic ACT review covering all sections with timed practice." },
  { name: "BCA Prep", desc: "Bergen County Academies entrance exam preparation." },
  { name: "Columbia SHP", desc: "Columbia Science Honors Program admissions prep." },
  { name: "Private Lessons", desc: "One-on-one tutoring tailored to individual learning needs." },
  { name: "School Subjects", desc: "Support across all core school subjects and grade levels." },
];

const defaultContests = [
  { name: "Math Contests", desc: "AMC, MATHCOUNTS, and competition math training." },
  { name: "Writing Contests", desc: "Essay and creative writing competition coaching." },
  { name: "Science Contest", desc: "Science olympiad and fair preparation." },
];

const heroDefaults = {
  headline: "Our",
  accent: "Programs",
  subheading: "Explore our comprehensive range of test preparation programs and academic tutoring services designed to help every student succeed.",
};

const ctaDefaults = {
  text: "Reach out and we'll help you find the perfect program for your needs.",
  button_text: "Download Course Catalog",
  button_link: "/catalog",
};

export default function Courses() {
  const { data: pageContent } = usePageContent("courses");
  const hero = { ...heroDefaults, ...pageContent?.hero };
  const cta = { ...ctaDefaults, ...pageContent?.cta };
  const programsSection = useInView();
  const contestsSection = useInView();

  return (
    <div>
      <PageHero
        title={hero.headline}
        accent={hero.accent}
        subtitle={hero.subheading}
      />

      {/* Programs Section */}
      <section className="py-16 md:py-24 bg-background" ref={programsSection.ref}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-accent" />
              <span className="text-accent text-sm font-semibold tracking-widest uppercase">Academic</span>
              <div className="h-px w-10 bg-accent" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">Programs</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
            {defaultPrograms.map((program, index) => (
              <div
                key={index}
                className={cn(
                  "group bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 hover:border-accent/40 transition-all duration-500 ease-out text-center cursor-pointer",
                  programsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${index * 100}ms`, transitionProperty: "opacity, transform, box-shadow, border-color" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-accent/20 group-hover:scale-110 flex items-center justify-center mb-5 mx-auto transition-all duration-300">
                  <BookOpen className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">{program.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{program.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contests Section */}
      <section className="py-16 md:py-24 bg-muted" ref={contestsSection.ref}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-10 bg-accent" />
              <span className="text-accent text-sm font-semibold tracking-widest uppercase">Competitive</span>
              <div className="h-px w-10 bg-accent" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">Contests</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-8 max-w-4xl mx-auto">
            {defaultContests.map((contest, index) => (
              <div
                key={index}
                className={cn(
                  "group bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 hover:border-accent/40 transition-all duration-500 ease-out text-center cursor-pointer",
                  contestsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${index * 100}ms`, transitionProperty: "opacity, transform, box-shadow, border-color" }}
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 group-hover:bg-accent/20 group-hover:scale-110 flex items-center justify-center mb-5 mx-auto transition-all duration-300">
                  <BookOpen className="h-7 w-7 text-primary group-hover:text-accent transition-colors duration-300" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-foreground group-hover:text-primary transition-colors duration-300 mb-2">{contest.name}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{contest.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-primary to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="container mx-auto px-4 text-center relative z-10">
          <p className="text-base md:text-lg text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            {cta.text}
          </p>
          <Link to={cta.button_link}>
            <Button variant="accent" size="xl" className="rounded-full gap-2 group">
              {cta.button_text}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
