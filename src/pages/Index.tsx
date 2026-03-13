import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Megaphone, CalendarDays } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import heroImage from "@/assets/ivy-league-campus.jpg";
import { usePageContent } from "@/hooks/useSiteContent";

const heroDefaults = {
  headline: "Where Academic Potential Finds a Home.",
  subheading: "We are a community growing together, leaving no regrets as we build the academic prowess and inner grit needed for a secure future. At PrepHaus, we don't just help you reach a goal; we give you the momentum to surpass it.",
  cta_primary_text: "View Programs",
  cta_primary_link: "/courses",
  cta_secondary_text: "Download Course Catalog",
  cta_secondary_link: "/catalog",
};

const ctaDefaults = {
  headline: "Ready to Start Your Journey?",
  subheading: "Contact us today and learn how PrepHaus can help you achieve your academic goals.",
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
  const navigate = useNavigate();
  const { user, isAdmin, isStudent, loading, isAdminLoading } = useAuth();
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
      <section
        className="relative min-h-[85vh] flex items-center justify-center bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/90 via-secondary/75 to-secondary/50" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-fade-in-up mt-8 md:mt-12">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 md:mb-6">
              {hero.headline}
            </h1>

            <p className="text-base md:text-lg text-white/90 mb-6 md:mb-8 max-w-lg">
              {hero.subheading}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-8 md:mb-12">
              <SmartLink to={hero.cta_primary_link}>
                <Button variant="hero" size="lg" className="w-full sm:w-auto">
                  {hero.cta_primary_text}
                </Button>
              </SmartLink>
              <SmartLink to={hero.cta_secondary_link}>
                <Button variant="hero-outline" size="lg" className="w-full sm:w-auto border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground/10">
                  {hero.cta_secondary_text}
                </Button>
              </SmartLink>
            </div>
          </div>
        </div>
      </section>

      {/* Wave Divider */}
      <div className="relative -mb-1">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block" preserveAspectRatio="none">
          <path d="M0,0 L0,40 Q360,80 720,40 Q1080,0 1440,40 L1440,0 Z" fill="hsl(var(--secondary))" fillOpacity="0.85" />
          <path d="M0,40 Q360,80 720,40 Q1080,0 1440,40 L1440,80 L0,80 Z" className="fill-accent/10" />
        </svg>
      </div>

      {/* Announcements Section */}
      {announcements.length > 0 && (
        <section className="py-12 md:py-20 bg-accent/10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8 md:mb-10 justify-center">
              <div className="p-2.5 rounded-full bg-accent/20">
                <Megaphone className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-secondary">Latest Announcements</h2>
            </div>
            <div className="flex flex-wrap justify-center gap-5 md:gap-6">
              {announcements.map((a, i) => (
                <Card
                  key={a.id}
                  className="group border border-border/50 bg-card hover:border-accent/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-accent/10 w-full md:max-w-sm lg:max-w-md"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="h-2 w-2 rounded-full bg-accent mt-2 shrink-0 animate-pulse" />
                      <h3 className="font-bold text-lg text-foreground group-hover:text-accent transition-colors">
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
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-4 md:mb-6">
            {cta.headline}
          </h2>
          <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
            {cta.subheading}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SmartLink to={cta.button_link}>
              <Button variant="hero" size="xl">
                {cta.button_text}
              </Button>
            </SmartLink>
          </div>
        </div>
      </section>
    </div>
  );
}

