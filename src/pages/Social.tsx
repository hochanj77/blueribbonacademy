import { Instagram, ExternalLink } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const socialDefaults = {
  instagram_url: "https://www.instagram.com/blueribbonacademy",
  instagram_handle: "@blueribbonacademy",
  google_business_url: "https://www.google.com/maps/place/Blue+Ribbon+Academy+-+SAT+%2F+ACT+Prep+Center/@40.9414,-73.9594,17z/",
  google_business_name: "Blue Ribbon Academy",
};

export default function Social() {
  const { data: socialData } = useSiteContent("global", "social_links");
  const s = { ...socialDefaults, ...socialData?.content };
  const cardsSection = useInView();

  const socialPlatforms = [
    {
      name: "Instagram",
      handle: s.instagram_handle,
      icon: Instagram,
      color: "bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400",
      url: s.instagram_url,
      description: "Daily study tips, student success stories, and behind-the-scenes content.",
    },
    {
      name: "Google Business",
      handle: s.google_business_name,
      icon: ExternalLink,
      color: "bg-gradient-to-br from-blue-500 via-green-500 to-yellow-400",
      url: s.google_business_url,
      description: "Find us on Google — reviews, directions, and business info.",
    },
  ];

  return (
    <div>
      <PageHero
        title="Connect"
        accent="With Us"
        subtitle="Follow along for study tips, student stories, and the latest updates from Blue Ribbon Academy."
      />

      <section className="py-16 md:py-24 bg-background" ref={cardsSection.ref}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
            {socialPlatforms.map((platform, index) => (
              <a
                key={platform.name}
                href={platform.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block bg-card rounded-2xl p-8 md:p-10 shadow-lg border border-border/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 hover:border-accent/30 transition-all duration-500 group text-center",
                  cardsSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${index * 150}ms`, transitionProperty: "opacity, transform, box-shadow, border-color" }}
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl ${platform.color} flex items-center justify-center mb-6 mx-auto group-hover:scale-110 transition-transform duration-300`}>
                  <platform.icon className="h-8 w-8 md:h-10 md:w-10 text-primary-foreground" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">{platform.name}</h3>
                <p className="text-accent font-semibold text-sm md:text-base mb-3">{platform.handle}</p>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">{platform.description}</p>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:text-accent transition-colors">
                  Follow Us <ExternalLink className="h-4 w-4" />
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
