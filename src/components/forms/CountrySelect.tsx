"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";

import { FormField } from "@/components/forms/form-field";
import { Input } from "@/components/ui/input";
import { WORLD_COUNTRY_OPTIONS } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

type CountrySelectProps = {
  id?: string;
  name?: string;
  label?: string | null;
  value: string;
  onChange: (label: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
};

export function CountrySelect({
  id: idProp,
  name,
  label = "Country" as string | null,
  value,
  onChange,
  error,
  hint,
  required,
  className,
  placeholder = "Search or select country"
}: CountrySelectProps) {
  const autoId = React.useId();
  const id = idProp ?? autoId;
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORLD_COUNTRY_OPTIONS;
    return WORLD_COUNTRY_OPTIONS.filter(
      (c) => c.label.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [query]);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const field = (
      <div ref={rootRef} className="relative">
        {name ? <input type="hidden" name={name} value={value} /> : null}
        <button
          type="button"
          id={id}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error && "border-destructive"
          )}
          onClick={() => setOpen((o) => !o)}
        >
          <span className={cn("truncate text-left", !value && "text-muted-foreground")}>
            {value || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" aria-hidden />
        </button>
        {open ? (
          <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-lg">
            <div className="flex items-center gap-2 border-b border-border px-2 py-2">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to filter…"
                className="h-8 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                autoFocus
              />
            </div>
            <ul
              role="listbox"
              className="max-h-56 overflow-y-auto py-1"
              aria-label="Countries"
            >
              {!required ? (
                <li>
                  <button
                    type="button"
                    role="option"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    —
                  </button>
                </li>
              ) : null}
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={value === c.label}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-muted",
                      value === c.label && "bg-primary/10 font-medium"
                    )}
                    onClick={() => {
                      onChange(c.label);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    {c.label}
                  </button>
                </li>
              ))}
              {!filtered.length ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No matches</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
  );

  if (label === null || label === "") {
    return <div className={className}>{field}</div>;
  }

  return (
    <FormField id={id} label={label} error={error} hint={hint} className={className}>
      {field}
    </FormField>
  );
}
