"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactForm() {
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const body = {
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      company: String(formData.get("company") ?? ""),
      topic: String(formData.get("topic") ?? ""),
      message: String(formData.get("message") ?? "")
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
      setMessage("Thanks — we received your message and will reply shortly.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Network error. Check your connection and try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Name</Label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            placeholder="Alex Morgan"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Work email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@company.com"
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-company">Company (optional)</Label>
          <Input
            id="contact-company"
            name="company"
            autoComplete="organization"
            placeholder="Acme Inc."
            className="rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-topic">Topic</Label>
          <Input
            id="contact-topic"
            name="topic"
            placeholder="Pricing, enterprise, partnership..."
            className="rounded-xl"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message">How can we help?</Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          placeholder="Tell us about timelines, team size, and goals."
          className="rounded-xl"
        />
      </div>
      <Button type="submit" size="lg" className="rounded-xl" disabled={status === "loading"}>
        {status === "loading" ? "Sending…" : "Send message"}
      </Button>
      {message ? (
        <p
          role="status"
          className={
            status === "success"
              ? "text-sm font-medium text-emerald-700 dark:text-emerald-400"
              : "text-sm font-medium text-destructive"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
