import PageHero from "@/components/PageHero";
import { useInView } from "@/hooks/useInView";

const grade9to11 = [
  {
    title: "Enhancement of Personal Growth",
    korean: "학생 개인의 특성을 근거로",
    description: "Find out what colleges will like about you and what areas to improve in order to optimize your chances of acceptance.",
  },
  {
    title: "Strategic Planning",
    korean: "학년별 주요전략을 세워",
    description: "Get on track with your college application—it is important to know in advance what you will need to do and when.",
  },
  {
    title: "Experience Consultation",
    korean: "학교성적과 학생의 적합한 Extracurricular Activity와 Academic Activity 또는 Research를 통해 개인의 역량을 높인다",
    description: "Enrich your application with nontraditional experiences to be a more competitive applicant.",
  },
];

const grade12 = [
  {
    title: "Test Assessment",
    korean: "또한, 최상의 SAT/ACT 성적을 획득하기위한 전략 구성과",
    description: "Is your SAT score or GPA at an appropriate level for your dream colleges? What do you do if your test score or GPA is not high enough? Let us help you.",
  },
  {
    title: "College Selection Consultation",
    korean: "그에 맞는 대학선발을 위한 적절한 전략을 세울과 동시에",
    description: "Students lose time and money applying to the wrong colleges; let us help you to find the right schools for you.",
  },
  {
    title: "Essay / Personal Statement Consultation",
    korean: "지원대학에서 가장 중요한 요소인 «에세이 작성» 단계를 밟습니다.",
    description: "The personal statement for your college application may be the most important writing in your life. Our team will help you develop a strong personal statement that accurately expresses who you are.",
  },
  {
    title: "College Application Review",
    korean: "학생 및 학부모님과 함께 최종단계인 입사지원서 review는 물론,",
    description: "The most common delay in admissions is due to an unexpected mistake on your application; our team will help prevent costly delays.",
  },
  {
    title: "Practice Interview",
    korean: "원서 제출 후 개인에게 적합한 인터뷰를 위한 여러 차례의 시뮬레이션을 시행합니다.",
    description: "What do colleges want to hear from you? How do you answer the toughest questions—ethics, motivation and more? Our team will help you fine-tune what you say and how you say it.",
  },
];

function ServiceCard({ title, korean, description, index }: { title: string; korean: string; description: string; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      <div className="group relative bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-accent/40 hover:shadow-lg transition-all duration-300">
        <div className="absolute top-0 left-0 w-1 h-full bg-accent/0 group-hover:bg-accent rounded-l-2xl transition-all duration-300" />
        <h3 className="text-lg md:text-xl font-bold text-secondary mb-2">{title}</h3>
        <p className="text-sm text-accent/80 mb-3 leading-relaxed">{korean}</p>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export default function CollegeConsulting() {
  const heroRef = useInView(0.1);

  return (
    <div>
      <PageHero
        title="College"
        accent="Consulting"
        subtitle="Strategic guidance for 9th–12th graders to maximize college acceptance potential."
      />

      {/* 9-11th Grade */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div ref={heroRef.ref} className={`text-center mb-12 transition-all duration-700 ${heroRef.inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-accent" />
              <span className="text-accent text-sm font-semibold tracking-widest uppercase">Underclassmen</span>
              <div className="h-px w-12 bg-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">Grades 9 — 11</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Build a strong foundation and position yourself competitively before senior year.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {grade9to11.map((s, i) => (
              <ServiceCard key={s.title} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* 12th Grade */}
      <section className="py-16 md:py-24 bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-12 bg-accent" />
              <span className="text-accent text-sm font-semibold tracking-widest uppercase">Seniors</span>
              <div className="h-px w-12 bg-accent" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary">12th Grade</h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">Comprehensive support through every stage of the college application process.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {grade12.map((s, i) => (
              <ServiceCard key={s.title} {...s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20 bg-secondary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-bold text-secondary-foreground mb-4">
            Ready to Plan Your Future?
          </h2>
          <p className="text-secondary-foreground/70 mb-8 max-w-2xl mx-auto">
            Schedule a consultation to discuss your goals and build a personalized roadmap to your dream school.
          </p>
          <a href="/contact">
            <button className="inline-flex items-center justify-center gap-2 rounded-md bg-accent text-accent-foreground px-10 h-14 text-lg font-bold shadow-lg hover:bg-accent/90 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
              Schedule Consultation
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}
