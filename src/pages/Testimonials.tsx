import { Link } from "react-router-dom";
import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";
import { usePageContent } from "@/hooks/useSiteContent";
import { Quote, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const heroDefaults = {
  headline: "Student",
  accent: "Testimonials",
  subheading: "At Blue Ribbon, we aim to provide the best learning experience for our students to ensure their academic success. See what our students have had to say about us!",
};

const ctaDefaults = {
  headline: "Join Our Success Stories",
  subheading: "Start your journey with Blue Ribbon Academy today.",
  button_text: "Get Started",
  button_link: "/contact",
};

const testimonials = [
  {
    name: "Regina Lee",
    text: "I started Blue Ribbon Academy 9th grade, doing chemistry. As a freshman in high school, I was looking for guidance and support in academics. Blue Ribbon Academy especially Christine was always prepared with the necessary resources for me to grow as a learner. In 10th grade, I did SAT Math 2 tutoring and in 11th grade, I did SAT tutoring. I scored great on both exams, and now as a senior, I am heading to UCLA!",
  },
  {
    name: "J. Park",
    text: "AMAZING learning environment! From SAT prep to essays, Blue Ribbon has helped me throughout my high school experience and has allowed me to stand out in the competitive Northern Valley Demarest environment. The writing, math, and science teachers here also seem to know EXACTLY what they are doing, and teach better than some of my teachers at school haha! Blue Ribbon has successfully guided me through my high school years, and because of that, I will now be attending University of Pennsylvania's Class of 2026! Thanks Blue Ribbon, and go Quakers!!!",
  },
  {
    name: "Michelle Jo",
    text: "I go to New Milford High School and was at Blue Ribbon Academy for the entirety of my SAT prep. The teachers are extremely well educated and are able to create unique bonds with the students. Additionally, the staff are extremely friendly and genuinely care about the success of their students! I was able to successfully reach my SAT goals through Blue Ribbon, as the director definitely played a big role in helping me get into Northwestern! I would highly recommend this academy to other students :)!",
  },
  {
    name: "Daniel K.",
    text: "Blue Ribbon Academy's SAT prep program was exactly what I needed. The personalized attention and strategic approach helped me improve my score by over 200 points. The instructors really understand the test and know how to teach effectively. I'm now attending Columbia University!",
  },
  {
    name: "Sarah L.",
    text: "The college consulting at Blue Ribbon was invaluable. They helped me craft my personal statement and guided me through every step of the application process. I couldn't have gotten into my dream school without their support. Highly recommend to any student serious about their future!",
  },
  {
    name: "James C.",
    text: "As a parent, I was impressed by how dedicated the Blue Ribbon team is to each student's success. My son's grades and confidence improved dramatically. The tutors are patient, knowledgeable, and truly passionate about education. Worth every penny.",
  },
];

function TestimonialCard({ name, text, index }: { name: string; text: string; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
      style={{ transitionDelay: `${(index % 3) * 100}ms` }}
    >
      <div className="relative bg-card border border-border rounded-2xl p-6 md:p-8 h-full flex flex-col hover:border-accent/30 hover:shadow-xl transition-all duration-300 group">
        <Quote className="h-8 w-8 text-accent/30 group-hover:text-accent/50 transition-colors mb-4 shrink-0" />
        <blockquote className="text-muted-foreground text-sm md:text-base leading-relaxed flex-1 mb-6">
          "{text}"
        </blockquote>
        <div className="border-t border-border pt-4">
          <p className="font-semibold text-secondary">{name}</p>
          <p className="text-xs text-accent">Blue Ribbon Academy Student</p>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const { data: pageContent } = usePageContent("testimonials");
  const hero = { ...heroDefaults, ...pageContent?.hero };
  const cta = { ...ctaDefaults, ...pageContent?.cta };

  return (
    <div>
      <PageHero
        title={hero.headline}
        accent={hero.accent}
        subtitle={hero.subheading}
      />

      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((t, i) => (
              <TestimonialCard key={t.name} {...t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary-foreground mb-4">
            {cta.headline}
          </h2>
          <p className="text-secondary-foreground/70 mb-8 max-w-2xl mx-auto">
            {cta.subheading}
          </p>
          <Link to={cta.button_link}>
            <Button variant="accent" size="lg" className="rounded-full gap-2 group shadow-lg">
              {cta.button_text}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
