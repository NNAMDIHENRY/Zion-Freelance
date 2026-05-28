import Link from "next/link";

type Props = {
  title: string;
  description?: string;
  crumbs?: { label: string; href?: string }[];
};

export function AdminPageHeader({ title, description, crumbs }: Props) {
  return (
    <header className="space-y-2">
      {crumbs?.length ? (
        <p className="text-sm text-muted-foreground">
          <Link href="/admin" className="text-primary hover:underline">
            Admin
          </Link>
          {crumbs.map((c) => (
            <span key={c.label}>
              <span className="mx-2">/</span>
              {c.href ? (
                <Link href={c.href} className="text-primary hover:underline">
                  {c.label}
                </Link>
              ) : (
                <span className="text-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
    </header>
  );
}
