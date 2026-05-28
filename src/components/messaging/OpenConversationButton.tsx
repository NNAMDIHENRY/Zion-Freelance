"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Base = {
  label?: string;
  className?: string;
  size?: React.ComponentProps<typeof Button>["size"];
  variant?: React.ComponentProps<typeof Button>["variant"];
};

export type OpenConversationButtonProps = Base &
  (
    | { mode: "proposal"; proposalId: string }
    | { mode: "client-to-freelancer"; projectId: string; freelancerUserId: string }
    | { mode: "freelancer-to-client"; projectId: string }
    | { mode: "direct"; targetUserId: string }
    | { mode: "client-directory"; freelancerUserId: string }
  );

function bodyForProps(props: OpenConversationButtonProps): Record<string, string> {
  if (props.mode === "proposal") return { proposalId: props.proposalId };
  if (props.mode === "direct" || props.mode === "client-directory") {
    return { targetUserId: props.mode === "direct" ? props.targetUserId : props.freelancerUserId };
  }
  if (props.mode === "client-to-freelancer") {
    return { projectId: props.projectId, freelancerUserId: props.freelancerUserId };
  }
  return { projectId: props.projectId };
}

function allowedForRole(props: OpenConversationButtonProps, role: Role | undefined) {
  if (!role || role === Role.ADMIN) return false;
  if (props.mode === "direct" || props.mode === "client-directory") {
    return role === Role.CLIENT || role === Role.FREELANCER;
  }
  if (props.mode === "proposal") return role === Role.CLIENT || role === Role.FREELANCER;
  if (props.mode === "client-to-freelancer") return role === Role.CLIENT;
  return role === Role.FREELANCER;
}

export function OpenConversationButton(props: OpenConversationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [busy, setBusy] = React.useState(false);

  const role = session?.user.role;

  const loginHref = `/auth/login?callbackUrl=${encodeURIComponent(
    props.mode === "client-directory" ? "/freelancers" : pathname || "/dashboard"
  )}`;

  if (status === "authenticated" && role === Role.ADMIN) return null;

  if (status === "authenticated" && !allowedForRole(props, role)) return null;

  if (status === "unauthenticated") {
    if (props.mode !== "client-directory" && props.mode !== "direct") return null;
    return (
      <Button
        type="button"
        size={props.size ?? "sm"}
        variant={props.variant ?? "outline"}
        className={cn(props.className)}
        asChild
      >
        <Link href={loginHref}>{props.label ?? "Message freelancer"}</Link>
      </Button>
    );
  }

  const label = props.label ?? "Message";

  async function start() {
    if (!session?.user?.id) {
      router.push(loginHref);
      return;
    }

    setBusy(true);

    try {
      const response = await fetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(bodyForProps(props))
      });

      const payload = (await response.json()) as { conversationId?: string; error?: string };

      if (!response.ok || !payload.conversationId) {
        toast.error(payload.error ?? "Could not open conversation");
        return;
      }

      router.push(`/dashboard/messages?conversation=${encodeURIComponent(payload.conversationId)}`);
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      type="button"
      size={props.size ?? "sm"}
      variant={props.variant ?? "default"}
      disabled={busy || status === "loading"}
      className={cn(props.className)}
      onClick={() => void start()}
    >
      {busy ? "…" : label}
    </Button>
  );
}
