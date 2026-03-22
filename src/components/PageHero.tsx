interface PageHeroProps {
  title: string;
  accent?: string;
  subtitle?: string;
}

export default function PageHero({ title, accent, subtitle }: PageHeroProps) {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-secondary via-primary to-secondary overflow-hidden">
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '32px 32px'
      }} />
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto px-4 relative z-10 text-center">
        <div className="max-w-3xl mx-auto animate-fade-in-up">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-primary-foreground leading-tight tracking-tight mb-4">
            {title}{accent && <>{" "}<span className="text-accent">{accent}</span></>}
          </h1>
          {subtitle && (
            <p className="text-base md:text-xl text-primary-foreground/70 leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
