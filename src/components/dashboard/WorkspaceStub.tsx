type WorkspaceStubProps = {
  title: string;
  description: string;
};

export function WorkspaceStub({ title, description }: WorkspaceStubProps) {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
      <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        This screen is scaffolded for a future module. The navigation and layout are production-ready; data
        wiring comes next.
      </div>
    </div>
  );
}
