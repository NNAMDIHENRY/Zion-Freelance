"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function FormField({
  id,
  label,
  hint,
  error,
  className,
  children
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p className="text-xs font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type FormTextInputProps = React.ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormTextInput({ id, label, hint, error, className, ...props }: FormTextInputProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error}>
      <Input id={fieldId} className={cn("h-10", className)} {...props} />
    </FormField>
  );
}

export type FormTextAreaProps = React.ComponentProps<typeof Textarea> & {
  label: string;
  hint?: string;
  error?: string;
};

export function FormTextArea({ id, label, hint, error, className, ...props }: FormTextAreaProps) {
  const autoId = React.useId();
  const fieldId = id ?? autoId;
  return (
    <FormField id={fieldId} label={label} hint={hint} error={error}>
      <Textarea id={fieldId} className={cn("min-h-[96px] resize-y", className)} {...props} />
    </FormField>
  );
}
