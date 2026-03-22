import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, CalendarDays, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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

function SmartLink({ to, children, ...props }: { to: string; children: React.ReactNode; [key: string]: any }) {
  if (to.startsWith('http')) {
    return <a href={to} target="_blank" rel="noopener noreferrer" {...props}>{children}</a>;
  }
  return <Link to={to} {...props}>{children}</Link>;
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
      {/* Hero Section — full viewport, cinematic */}
      <section
        className="relative min-h-screen flex items-center"
      >
        {/* Rich gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary to-secondary" />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 via-transparent to-transparent" />

        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />

        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
          <div className="max-w-3xl animate-fade-in-up">
            {/* Accent line */}
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

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Announcements Section */}
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
                <Card
                  key={a.id}
                  className="card-sleek w-full md:max-w-sm lg:max-w-md overflow-hidden"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-accent mt-1.5 shrink-0 animate-pulse" />
                      <h3 className="font-bold text-lg text-foreground">
                        {a.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4 pl-5">
                      {a.content}
                    </p>
                    {a.published_at && (
                      <div className="flex items-center gap-1.5 pl-5 text-muted-foreground/60">
                        <CalendarDays className="h-3.5 w-3.5" />
                        <p className="text-xs font-medium">
                          {format(new Date(a.published_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-secondary via-primary to-secondary relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }} />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
            {cta.headline}
          </h2>
          <p className="text-lg text-primary-foreground/70 mb-10 max-w-2xl mx-auto">
            {cta.subheading}
          </p>
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
