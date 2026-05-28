"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Briefcase, Star } from "lucide-react";

import { VerifiedBadge } from "@/components/ui/verified-badge";

import { ReviewCard } from "@/components/reviews/ReviewCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FreelancerDetail = {
  user: { id: string; name: string; verified?: boolean; imageUrl: string | null };
  profile: {
    headline: string | null;
    bio: string | null;
    hourlyRate: string | null;
    availability: string;
    categorySlugs: string[];
    ratingAverage: string;
    ratingCount: number;
    skills: Array<{ id: string; name: string; slug: string }>;
  };
  portfolio: Array<{
    id: string;
    title: string;
    description: string | null;
    projectUrl: string | null;
    imageUrl: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: Date;
    authorUser: { name: string };
    project: { title: string };
  }>;
  completedContracts: Array<{
    id: string;
    projectId: string;
    projectTitle: string;
    agreedAmount: string;
    currency: string;
    completedAt: Date | null;
  }>;
};

const TABS = ["overview", "portfolio", "reviews", "contracts"] as const;
type Tab = (typeof TABS)[number];

const D = "d" + "iv";

export function FreelancerPublicProfile({ data }: { data: FreelancerDetail }) {
  const [tab, setTab] = React.useState<Tab>("overview");
  const { user, profile } = data;
  const initials = user.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return React.createElement(
    "div",
    { className: "mx-auto max-w-4xl space-y-8 px-4 py-12" },
    React.createElement(
      "header",
      { className: "flex flex-col gap-6 sm:flex-row sm:items-start" },
      React.createElement(
        D,
        { className: "relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-primary/10" },
        user.imageUrl
          ? React.createElement(Image, {
              src: user.imageUrl,
              alt: "",
              fill: true,
              className: "object-cover",
              unoptimized: true
            })
          : React.createElement(
              "span",
              {
                className:
                  "flex h-full w-full items-center justify-center text-2xl font-semibold text-primary"
              },
              initials
            )
      ),
      React.createElement(
        D,
        { className: "min-w-0 flex-1 space-y-3" },
        React.createElement(
          D,
          { className: "flex flex-wrap items-center gap-2" },
          React.createElement("h1", { className: "text-3xl font-semibold tracking-tight" }, user.name),
          user.verified ? React.createElement(VerifiedBadge) : null
        ),
        profile.headline
          ? React.createElement("p", { className: "text-lg text-muted-foreground" }, profile.headline)
          : null,
        React.createElement(
          D,
          { className: "flex flex-wrap items-center gap-4 text-sm" },
          React.createElement(
            "span",
            { className: "inline-flex items-center gap-1 font-medium" },
            React.createElement(Star, {
              className: "h-4 w-4 fill-secondary text-secondary"
            }),
            ` ${profile.ratingAverage} (${profile.ratingCount} reviews)`
          ),
          profile.hourlyRate
            ? React.createElement(
                "span",
                { className: "text-muted-foreground" },
                `USD ${profile.hourlyRate}/hr`
              )
            : null,
          React.createElement(
            "span",
            {
              className:
                "rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize"
            },
            profile.availability.toLowerCase().replaceAll("_", " ")
          )
        ),
        React.createElement(
          Button,
          { asChild: true, className: "rounded-xl" },
          React.createElement(Link, { href: `/dashboard/messages?freelancer=${user.id}` }, "Hire / message")
        )
      )
    ),
    React.createElement(
      "nav",
      { className: "flex flex-wrap gap-2 border-b border-border/60 pb-2" },
      TABS.map((t) =>
        React.createElement(
          "button",
          {
            key: t,
            type: "button",
            onClick: () => setTab(t),
            className: cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )
          },
          t
        )
      )
    ),
    tab === "overview"
      ? React.createElement(
          "section",
          { className: "space-y-6" },
          profile.bio
            ? React.createElement("p", { className: "text-sm leading-relaxed text-muted-foreground" }, profile.bio)
            : React.createElement("p", { className: "text-sm text-muted-foreground" }, "No bio yet."),
          profile.skills.length
            ? React.createElement(
                "ul",
                { className: "flex flex-wrap gap-2" },
                profile.skills.map((s) =>
                  React.createElement(
                    "li",
                    {
                      key: s.id,
                      className:
                        "rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                    },
                    s.name
                  )
                )
              )
            : null
        )
      : null,
    tab === "portfolio"
      ? React.createElement(
          "section",
          null,
          data.portfolio.length === 0
            ? React.createElement("p", { className: "text-sm text-muted-foreground" }, "No portfolio items yet.")
            : React.createElement(
                "ul",
                { className: "grid gap-4 sm:grid-cols-2" },
                data.portfolio.map((f) =>
                  React.createElement(
                    "li",
                    { key: f.id, className: "overflow-hidden rounded-xl border border-border/60" },
                    f.imageUrl
                      ? React.createElement("img", {
                          src: f.imageUrl,
                          alt: f.title,
                          className: "aspect-video w-full object-cover"
                        })
                      : React.createElement(
                          D,
                          {
                            className:
                              "flex aspect-video items-center justify-center bg-muted text-sm text-muted-foreground"
                          },
                          "No preview"
                        ),
                    React.createElement(
                      D,
                      { className: "space-y-1 p-4" },
                      React.createElement("p", { className: "font-semibold" }, f.title),
                      f.description
                        ? React.createElement(
                            "p",
                            { className: "text-sm text-muted-foreground line-clamp-3" },
                            f.description
                          )
                        : null,
                      f.projectUrl
                        ? React.createElement(
                            "a",
                            {
                              href: f.projectUrl,
                              target: "_blank",
                              rel: "noreferrer",
                              className: "text-xs font-medium text-primary hover:underline"
                            },
                            "View project"
                          )
                        : null
                    )
                  )
                )
              )
        )
      : null,
    tab === "reviews"
      ? React.createElement(
          "section",
          { className: "space-y-4" },
          data.reviews.length === 0
            ? React.createElement("p", { className: "text-sm text-muted-foreground" }, "No reviews yet.")
            : data.reviews.map((r) =>
                React.createElement(ReviewCard, {
                  key: r.id,
                  review: {
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    createdAt: r.createdAt.toISOString(),
                    authorName: r.authorUser.name,
                    projectTitle: r.project.title,
                    subject: "CLIENT_TO_FREELANCER"
                  }
                })
              )
        )
      : null,
    tab === "contracts"
      ? React.createElement(
          "section",
          { className: "space-y-3" },
          data.completedContracts.length === 0
            ? React.createElement(
                "p",
                { className: "text-sm text-muted-foreground" },
                "No completed contracts yet."
              )
            : React.createElement(
                "ul",
                { className: "divide-y divide-border/60 rounded-xl border border-border/60" },
                data.completedContracts.map((c) =>
                  React.createElement(
                    "li",
                    { key: c.id, className: "flex items-center gap-3 px-4 py-3 text-sm" },
                    React.createElement(Briefcase, {
                      className: "h-4 w-4 shrink-0 text-muted-foreground"
                    }),
                    React.createElement(
                      D,
                      { className: "min-w-0 flex-1" },
                      React.createElement(
                        Link,
                        {
                          href: `/projects/${c.projectId}`,
                          className: "font-medium hover:text-primary hover:underline"
                        },
                        c.projectTitle
                      ),
                      c.completedAt
                        ? React.createElement(
                            "p",
                            { className: "text-xs text-muted-foreground" },
                            `Completed ${new Date(c.completedAt).toLocaleDateString()}`
                          )
                        : null
                    ),
                    React.createElement(
                      "span",
                      { className: "shrink-0 tabular-nums text-muted-foreground" },
                      `${c.currency} ${c.agreedAmount}`
                    )
                  )
                )
              )
        )
      : null
  );
}
