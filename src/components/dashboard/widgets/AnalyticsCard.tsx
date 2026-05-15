import { cn } from "@/lib/utils";

export type AnalyticsCardProps = {
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function AnalyticsCard({ title, description, className, children }: AnalyticsCardProps) {
  return (
    <div
      className={cn(
        "flex min-h-[220px] flex-col rounded-2xl border border-border/60 bg-card p-5 shadow-subtle",
        className
      )}
    >
      <div>
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        {children ?? (
          <p>
            Chart area reserved — connect analytics when your data layer is ready.
          </p>
        )}
      </div>
    </div>
  );
}
