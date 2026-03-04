import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const languageOptions = [
  { value: "english", label: "English" },
  { value: "korean", label: "Korean" },
];

const locationOptions = [
  { value: "palisades-park", label: "Palisades Park" },
  { value: "closter", label: "Closter" },
  { value: "both", label: "Both" },
];

export default function CatalogRequest() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formData, setFormData] = useState({
    studentName: "",
    phone: "",
    email: "",
    preferredLanguage: "",
    preferredLocation: "",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentName.trim() || !formData.email.trim()) {
      toast.error("Please fill in the student name and email.");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the terms & conditions.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.from("catalog_requests").insert({
      student_name: formData.studentName.trim().slice(0, 200),
      phone: formData.phone.trim().slice(0, 20) || null,
      email: formData.email.trim().slice(0, 255),
      preferred_language: formData.preferredLanguage || null,
      preferred_location: formData.preferredLocation || null,
      message: formData.message.trim().slice(0, 1000) || null,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error("Something went wrong. Please try again later.");
      return;
    }

    toast.success("Request submitted! We'll send the course catalog to your email shortly.");

    setFormData({
      studentName: "",
      phone: "",
      email: "",
      preferredLanguage: "",
      preferredLocation: "",
      message: "",
    });
    setAcceptedTerms(false);
  };

  return (
    <div className="pt-20 md:pt-24">
      <section className="py-10 md:py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                Download <span className="text-accent">Course Catalog</span>
              </h1>
              <p className="text-muted-foreground">
                Fill out the form below and we'll send you our complete course catalog.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="studentName">Student's Name (First, Last) *</Label>
                  <Input
                    id="studentName"
                    placeholder="Student's Name"
                    value={formData.studentName}
                    onChange={(e) => handleChange("studentName", e.target.value)}
                    maxLength={200}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Preferred Language</Label>
                  <Select
                    value={formData.preferredLanguage}
                    onValueChange={(value) => handleChange("preferredLanguage", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Eng / Kor" />
                    </SelectTrigger>
                    <SelectContent>
                      {languageOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="space-y-2">
                <Label htmlFor="message">Leave us a message...</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={formData.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  maxLength={1000}
                  rows={4}
                />
              </div>

              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This form collects information we will use to send you updates about promotions, special offers, and news.
                  We will not share or sell your personal information. You can unsubscribe at any time.
                </p>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  />
                  <Label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                    I accept terms & conditions
                  </Label>
                </div>
              </div>

              <div className="text-center pt-4">
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Submitting..." : "Download Catalog"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
