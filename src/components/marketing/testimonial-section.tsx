import { cn } from "@/lib/utils";

import { Card, CardContent } from "@/components/ui/card";

export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  org: string;
};

type TestimonialSectionProps = {
  title: string;
  description?: string;
  items: Testimonial[];
  className?: string;
};

export function TestimonialSection({
  title,
  description,
  items,
  className
}: TestimonialSectionProps) {
  return (
    <section
      className={cn(
        "border-y border-border/50 bg-gradient-to-b from-muted/20 to-background py-16 sm:py-20",
        className
      )}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h2>
          {description ? (
            <p className="mt-4 text-pretty text-muted-foreground sm:text-lg">{description}</p>
          ) : null}
        </div>
        <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((t) => (
            <li key={t.name + t.org}>
              <Card className="h-full border-border/60 transition-shadow duration-300 hover:shadow-md">
                <CardContent className="p-6 sm:p-7">
                  <p className="text-sm leading-relaxed text-foreground/90">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-6 border-t border-border/50 pt-4">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.role} · {t.org}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
