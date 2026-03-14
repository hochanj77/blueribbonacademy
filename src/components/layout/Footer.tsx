import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Instagram, ExternalLink } from "lucide-react";
import blueRibbonLogo from "@/assets/blue-ribbon-logo.jpg";
import { useSiteContent } from "@/hooks/useSiteContent";

const quickLinks = [
  { label: "About Us", href: "/about" },
  { label: "Programs", href: "/courses" },
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
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <img
              src={blueRibbonLogo}
              alt="Blue Ribbon Academy"
              className="h-12 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-secondary-foreground/70 text-sm leading-relaxed">
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
                  className="p-2 rounded-full bg-secondary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className="text-secondary-foreground/70 hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-secondary-foreground/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-accent" />
                <span>{contact.address_line1}<br />{contact.address_line2}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0 text-accent" />
                <span>{contact.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0 text-accent" />
                <span>{contact.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-secondary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-secondary-foreground/60 text-sm">
            © {new Date().getFullYear()} PrepHaus. All rights reserved.
          </p>
          <div className="flex gap-6">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-secondary-foreground/60 hover:text-accent text-sm transition-colors"
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

