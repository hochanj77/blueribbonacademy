import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useSiteContent } from "@/hooks/useSiteContent";
import { supabase } from "@/integrations/supabase/client";
import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

const gradeOptions = [
  { value: "8", label: "8th Grade" },
  { value: "9", label: "9th Grade" },
  { value: "10", label: "10th Grade" },
  { value: "11", label: "11th Grade" },
  { value: "12", label: "12th Grade" },
  { value: "college", label: "College" },
];

const subjectOptions = [
  { value: "sat", label: "SAT Prep" },
  { value: "act", label: "ACT Prep" },
  { value: "math", label: "Math" },
  { value: "english", label: "English/Writing" },
  { value: "science", label: "Science" },
  { value: "other", label: "Other" },
];

const contactDefaults = {
  address_line1: "41 Union Ave FL2",
  address_line2: "Cresskill, NJ 07626",
  phone: "+1.201.406.3929",
  email: "info@blueribbon-nj.com",
  hours_weekday: "Mon-Fri: 3:30pm - 9:00pm",
  hours_weekend: "Sat: 9:00am - 4:00pm",
};

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    grade: "",
    subjects: [] as string[],
    message: "",
    wantsCatalog: false,
  });

  const { data: contactData } = useSiteContent("global", "contact_info");
  const c = { ...contactDefaults, ...contactData?.content };
  const infoSection = useInView();
  const formSection = useInView();

  const contactInfo = [
    { icon: MapPin, title: "Visit Us", details: [c.address_line1, c.address_line2] },
    { icon: Phone, title: "Call Us", details: [c.phone] },
    { icon: Mail, title: "Email Us", details: [c.email] },
    { icon: Clock, title: "Office Hours", details: [c.hours_weekday, c.hours_weekend] },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        grade: formData.grade || null,
        subjects: formData.subjects.length > 0 ? formData.subjects : null,
        message: formData.message,
        wants_catalog: formData.wantsCatalog,
      });
      if (error) throw error;
      toast.success("Message sent! We'll get back to you within 24 hours.");
      setFormData({ name: "", email: "", phone: "", grade: "", subjects: [], message: "", wantsCatalog: false });
    } catch {
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHero
        title="Contact"
        accent="Us"
        subtitle="Ready to start your journey to academic success? Get in touch for a free consultation."
      />

      {/* Contact Info Cards */}
      <section className="py-12 md:py-16 bg-background" ref={infoSection.ref}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {contactInfo.map((item, i) => (
              <div
                key={item.title}
                className={cn(
                  "bg-card rounded-2xl p-5 md:p-6 shadow-lg border border-border/40 border-l-4 border-l-accent transition-all duration-700",
                  infoSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm mb-1.5">{item.title}</h3>
                    {item.details.map((detail, j) => (
                      <p key={j} className="text-muted-foreground text-xs leading-relaxed">{detail}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-8 md:py-16 bg-background" ref={formSection.ref}>
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
            <div className={cn(
              "lg:col-span-2 transition-all duration-700",
              formSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}>
              <div className="bg-card rounded-2xl p-6 md:p-8 shadow-xl border border-border/40">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-6">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input id="name" placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input id="email" type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" type="tel" placeholder="(555) 123-4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="grade">Student Grade Level</Label>
                      <select
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Select grade</option>
                        {gradeOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Subject(s) of Interest</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                      {subjectOptions.map((option) => (
                        <div key={option.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={option.value}
                            checked={formData.subjects.includes(option.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setFormData({ ...formData, subjects: [...formData.subjects, option.value] });
                              } else {
                                setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== option.value) });
                              }
                            }}
                          />
                          <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">{option.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea id="message" placeholder="Tell us about your goals and how we can help..." rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="catalog" checked={formData.wantsCatalog} onCheckedChange={(checked) => setFormData({ ...formData, wantsCatalog: checked as boolean })} />
                    <Label htmlFor="catalog" className="text-sm font-normal cursor-pointer">I'd like to receive the course catalog via email</Label>
                  </div>

                  <Button variant="accent" size="lg" type="submit" disabled={isSubmitting} className="w-full rounded-full gap-2 group">
                    {isSubmitting ? "Sending..." : "Send Message"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </form>
              </div>
            </div>

            {/* Map */}
            <div className={cn(
              "transition-all duration-700",
              formSection.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )} style={{ transitionDelay: "200ms" }}>
              <div className="rounded-2xl overflow-hidden shadow-lg border border-border/40 h-64 lg:h-full lg:min-h-[400px]">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3017.5!2d-73.9594!3d40.9414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2e8f5a8b9c3d1%3A0x1234567890abcdef!2s41+Union+Ave%2C+Cresskill%2C+NJ+07626!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Blue Ribbon Academy Location"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
