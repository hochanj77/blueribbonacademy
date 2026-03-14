import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, ExternalLink } from "lucide-react";
import blueRibbonLogo from "@/assets/blue-ribbon-logo.jpg";
import { useSiteContent } from "@/hooks/useSiteContent";

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Programs", href: "/courses" },
  { label: "Schedule", href: "/schedule" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

const contactDefaults = {
  address_line1: "41 Union Ave FL2",
  address_line2: "Cresskill, NJ 07626",
  phone: "+1.201.406.3929",
  email: "info@blueribbon-nj.com",
};

const socialDefaults = {
  instagram_url: "#",
  google_business_url: "https://share.google/sB0wrIS3IhJoOfnOJ",
};

export function Footer() {
  const { data: contactData } = useSiteContent("global", "contact_info");
  const { data: socialData } = useSiteContent("global", "social_links");

  const contact = { ...contactDefaults, ...contactData?.content };
  const social = { ...socialDefaults, ...socialData?.content };

  const socialLinks = [
    { icon: Instagram, href: social.instagram_url, label: "Instagram" },
    { icon: ExternalLink, href: social.google_business_url, label: "Google Business" },
  ];

  return (
    <footer className="bg-secondary relative overflow-hidden">
      {/* Decorative accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
          {/* Brand Column */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="inline-block">
              <img
                src={blueRibbonLogo}
                alt="Blue Ribbon Academy"
                className="h-14 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-secondary-foreground/60 text-sm leading-relaxed">
              We believe all students have the right to receive a good education. We strive to help students develop character alongside academic prowess.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="p-2.5 rounded-xl bg-secondary-foreground/5 hover:bg-accent hover:text-accent-foreground transition-all duration-300 hover:scale-110"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-5 text-secondary-foreground">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/60 hover:text-accent transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-5 text-secondary-foreground">Contact Us</h4>
            <ul className="space-y-4 text-secondary-foreground/60 text-sm">
              <li className="flex items-start gap-3">
                <div className="p-1.5 rounded-lg bg-accent/10 mt-0.5">
                  <MapPin className="h-4 w-4 text-accent" />
                </div>
                <span>{contact.address_line1}<br />{contact.address_line2}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <span>{contact.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Mail className="h-4 w-4 text-accent" />
                </div>
                <span>{contact.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 md:mt-16 pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary-foreground/40 text-sm">
            © {new Date().getFullYear()} Blue Ribbon Academy, Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-secondary-foreground/40 hover:text-accent text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
