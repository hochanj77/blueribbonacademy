 import { Link } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import { 
   Calendar, 
   Clock, 
   CheckCircle, 
   Users, 
   Target, 
   FileText,
   MessageSquare,
   ArrowRight
 } from "lucide-react";
 
 const consultationBenefits = [
   {
     icon: Target,
     title: "Goal Assessment",
     description: "We'll discuss your target schools and scores to create a clear path forward.",
   },
   {
     icon: FileText,
     title: "Skills Evaluation",
     description: "Brief diagnostic to understand current strengths and areas for improvement.",
   },
   {
     icon: Users,
     title: "Program Matching",
     description: "We'll recommend the best Blue Ribbon program for your specific needs.",
   },
   {
     icon: Calendar,
     title: "Timeline Planning",
     description: "Create a realistic study schedule based on your test date and availability.",
   },
 ];
 
 const whatToExpect = [
   "A 30-45 minute conversation (phone, video, or in-person)",
   "Discussion of academic goals and college aspirations",
   "Review of any prior test scores or practice tests",
   "Overview of Blue Ribbon Academy programs and pricing",
   "Q&A session to address all your questions",
   "No pressure, no commitment required",
 ];
 
 export default function Consulting() {
   return (
    <div className="pt-20 md:pt-24">
       {/* Hero Section */}
      <section className="py-10 md:py-16 bg-muted">
         <div className="container mx-auto px-4">
           <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className="text-3xl md:text-5xl font-bold text-secondary mb-4 md:mb-6">
               Free <span className="text-accent">Consultation</span>
             </h1>
            <p className="text-base md:text-xl text-muted-foreground leading-relaxed mb-6 md:mb-8">
               Not sure where to start? Schedule a free consultation with our academic advisors 
               to create a personalized plan for SAT success.
             </p>
             <Button variant="accent" size="xl" asChild>
               <Link to="/contact">
                 Schedule Your Consultation
                 <ArrowRight className="h-5 w-5" />
               </Link>
             </Button>
           </div>
         </div>
       </section>
 
       {/* Benefits Section */}
      <section className="py-10 md:py-16 bg-background">
         <div className="container mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-4">
               What We'll <span className="text-accent">Cover</span>
             </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
               Our consultations are designed to give you complete clarity on the path forward.
             </p>
           </div>
 
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
             {consultationBenefits.map((benefit, index) => (
               <div
                 key={benefit.title}
                className="bg-card rounded-xl md:rounded-2xl p-4 md:p-8 text-center shadow-lg border border-border hover-lift animate-fade-in-up"
                 style={{ animationDelay: `${index * 0.1}s` }}
               >
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-primary/20 mb-4 md:mb-6">
                  <benefit.icon className="h-6 w-6 md:h-8 md:w-8 text-secondary" />
                 </div>
                <h3 className="text-base md:text-xl font-bold text-secondary mb-2 md:mb-3">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm md:text-base">{benefit.description}</p>
               </div>
             ))}
           </div>
         </div>
       </section>
 
       {/* What to Expect */}
      <section className="py-10 md:py-16 bg-warm">
         <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
             <div className="animate-fade-in-up">
              <h2 className="text-2xl md:text-4xl font-bold text-secondary mb-4 md:mb-6">
                 What to <span className="text-accent">Expect</span>
               </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
                 Our free consultations are informative, helpful, and completely pressure-free. 
                 Here's what you can expect:
               </p>
              <ul className="space-y-3 md:space-y-4">
                 {whatToExpect.map((item, index) => (
                   <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-accent shrink-0 mt-0.5" />
                    <span className="text-foreground text-sm md:text-base">{item}</span>
                   </li>
                 ))}
               </ul>
             </div>
 
            <div className="bg-card rounded-xl md:rounded-2xl p-6 md:p-8 shadow-2xl animate-fade-in-up animate-fade-in-delay">
               <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/20 mb-4 md:mb-6">
                  <MessageSquare className="h-8 w-8 md:h-10 md:w-10 text-accent" />
                 </div>
                <h3 className="text-xl md:text-2xl font-bold text-secondary mb-3 md:mb-4">Ready to Talk?</h3>
                <p className="text-muted-foreground text-sm md:text-base mb-4 md:mb-6">
                   Choose the consultation format that works best for you.
                 </p>
                 <div className="space-y-3">
                   <Link to="/contact" className="block">
                     <Button variant="hero" size="lg" className="w-full">
                       Book Online
                     </Button>
                   </Link>
                   <Button variant="hero-outline" size="lg" className="w-full" asChild>
                     <a href="tel:2015258577">
                       Call (201) 525-8577
                     </a>
                   </Button>
                 </div>
                 <p className="text-sm text-muted-foreground mt-4">
                   <Clock className="inline h-4 w-4 mr-1" />
                   Available Mon-Fri 9am-8pm, Sat-Sun 10am-5pm
                 </p>
               </div>
             </div>
           </div>
         </div>
       </section>
 
 
       {/* CTA */}
      <section className="py-10 md:py-16 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary-foreground mb-4 md:mb-6">
             Your SAT Success Story Starts Here
           </h2>
          <p className="text-base md:text-lg text-secondary-foreground/70 mb-6 md:mb-8 max-w-2xl mx-auto">
             Take the first step today. Schedule your free consultation and let's create a plan together.
           </p>
           <Link to="/contact">
             <Button variant="accent" size="xl">
               Schedule Free Consultation
             </Button>
           </Link>
         </div>
       </section>
     </div>
   );
 }