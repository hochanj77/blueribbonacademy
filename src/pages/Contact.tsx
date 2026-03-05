import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSiteContent } from "@/hooks/useSiteContent";

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
  address_line1: "268 Broad Ave Floor 2",
  address_line2: "Palisades Park, NJ 07650",
  phone: "(201) 525-8577",
  email: "info@prephaus.academy",
  hours_weekday: "Mon-Fri: 1:30pm - 9:00pm",
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

  const contactInfo = [
    {
      icon: MapPin,
      title: "Visit Us",
      details: [c.address_line1, c.address_line2],
    },
    {
      icon: Phone,
      title: "Call Us",
      details: [c.phone],
    },
    {
      icon: Mail,
      title: "Email Us",
      details: [c.email],
    },
    {
      icon: Clock,
      title: "Office Hours",
      details: [c.hours_weekday, c.hours_weekend],
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success("Message sent! We'll get back to you within 24 hours.");

    setFormData({
      name: "",
      email: "",
      phone: "",
      grade: "",
      subjects: [],
      message: "",
      wantsCatalog: false,
    });
    setIsSubmitting(false);
  };

  return (
    <div className="pt-20 md:pt-24">
      {/* Hero Section */}
      <section className="py-10 md:py-16 bg-muted">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Contact <span className="text-accent">Us</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Ready to start your journey to SAT success? Get in touch for a free consultation.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up">
            {contactInfo.map((item) => (
              <div key={item.title} className="bg-card rounded-xl p-4 shadow-md border border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                    <item.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-secondary text-sm mb-1">{item.title}</h3>
                    {item.details.map((detail, i) => (
                      <p key={i} className="text-muted-foreground text-xs">{detail}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Map/CTA */}
      <section className="py-6 md:py-10 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl p-5 shadow-lg border border-border animate-fade-in-up">
                <h2 className="text-xl font-bold text-secondary mb-3">Send Us a Message</h2>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="grade">Student Grade Level</Label>
                      <select
                        id="grade"
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      >
                        <option value="">Select grade</option>
                        {gradeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Subject(s) of Interest</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                          <Label htmlFor={option.value} className="text-sm font-normal cursor-pointer">
                            {option.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your goals and how we can help..."
                      rows={3}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="catalog"
                      checked={formData.wantsCatalog}
                      onCheckedChange={(checked) => setFormData({ ...formData, wantsCatalog: checked as boolean })}
                    />
                    <Label htmlFor="catalog" className="text-sm font-normal cursor-pointer">
                      I'd like to receive the course catalog via email
                    </Label>
                  </div>

                  <Button variant="hero" size="lg" type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </div>
            </div>

            {/* Map & CTA Sidebar */}
            <div className="space-y-4 animate-fade-in-up animate-fade-in-delay">
              <div className="rounded-xl overflow-hidden h-48">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3020.123!2d-73.9975!3d40.8484!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c2f6a3b3c4d5e7%3A0x1234567890abcdef!2s268+Broad+Ave%2C+Palisades+Park%2C+NJ+07650!5e0!3m2!1sen!2sus!4v1700000000000"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="PrepHaus Location"
                />
              </div>

            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

