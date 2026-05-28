"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Paperclip, Trash2 } from "lucide-react";
import { Role } from "@prisma/client";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import { NewConversationPanel } from "@/components/messaging/NewConversationPanel";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ConversationLite = {
  id: string;
  proposalId: string;
  projectTitle: string;
  peer: { id: string; name: string; email: string };
  lastMessagePreview: string;
  lastMessageAt: string | null;
  lastMessageSenderId: string | null;
  unread: number;
};

type MessageRow = {
  id: string;
  content: string;
  isDeleted?: boolean;
  senderId: string;
  createdAt: string;
  senderName: string;
  attachments: Array<{ id: string; name: string; mimeType: string; sizeBytes: number }>;
};

function sortAsc(rows: MessageRow[]) {
  return [...rows].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function MessagesDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewerId = session?.user?.id;

  const [pane, setPane] = React.useState<"list" | "chat">("list");
  const [rows, setRows] = React.useState<ConversationLite[]>([]);
  const [filter, setFilter] = React.useState("");
  const [active, setActive] = React.useState<string | null>(null);
  const [msgs, setMsgs] = React.useState<MessageRow[]>([]);
  const [peerTyping, setPeerTyping] = React.useState(false);
  const [text, setText] = React.useState("");
  const [files, setFiles] = React.useState<File[]>([]);

  const body = React.useRef<HTMLDivElement>(null);
  const filesRef = React.useRef<HTMLInputElement>(null);
  const seeded = React.useRef<string | null>(null);
  const since = React.useRef("");
  const typingAt = React.useRef(0);

  const list = React.useCallback(async () => {
    const res = await fetch("/api/conversations", { credentials: "include" });
    if (!res.ok) throw new Error("list");
    const j = (await res.json()) as { conversations?: ConversationLite[] };
    const c = j.conversations ?? [];
    setRows(c);
    return c;
  }, []);

  const open = React.useCallback(async (conversationId: string, mark = true) => {
    const res = await fetch(`/api/conversations/${conversationId}/messages?take=60`, {
      credentials: "include"
    });
    if (!res.ok) throw new Error("open");
    const j = (await res.json()) as { messages?: MessageRow[]; peerTyping?: boolean };
    const ordered = sortAsc(j.messages ?? []);
    since.current = ordered.at(-1)?.createdAt ?? new Date().toISOString();
    setMsgs(ordered);
    setPeerTyping(Boolean(j.peerTyping));

    if (mark) {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: "POST",
        credentials: "include"
      }).catch(() => undefined);

      setRows((r) => r.map((x) => (x.id === conversationId ? { ...x, unread: 0 } : x)));
    }

    queueMicrotask(() =>
      body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "auto" })
    );
  }, []);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    void (async () => {
      try {
        const starter = await list();
        if (cancelled) return;

        const deep = searchParams.get("conversation");
        if (deep) {
          setActive(deep);
          setPane("chat");
          router.replace("/dashboard/messages");
          return;
        }

        const pid = searchParams.get("proposal");

        if (pid && seeded.current !== pid) {
          seeded.current = pid;
          const ensured = await fetch("/api/conversations", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ proposalId: pid })
          });
          const payload = (await ensured.json().catch(() => ({}))) as { conversationId?: string };
          if (ensured.ok && payload.conversationId) {
            const next = await list();
            if (cancelled) return;
            const cid =
              next.find((item) => item.proposalId === pid)?.id ?? payload.conversationId;
            setActive(cid);
            setPane("chat");
            router.replace("/dashboard/messages");
            return;
          }
          toast.error("Thread blocked for that proposal.");
          seeded.current = null;
          return;
        }

        seeded.current = null;
        setActive((cur) => cur ?? starter[0]?.id ?? null);
      } catch {
        toast.error("Messaging bootstrap failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, searchParams, router, list]);

  React.useEffect(() => {
    if (!active) {
      setMsgs([]);
      since.current = "";
      setPeerTyping(false);
      return;
    }

    let stop = false;

    void open(active);

    async function tick() {
      if (!since.current) return;

      const qs = encodeURIComponent(since.current);

      try {
        const res = await fetch(
          `/api/conversations/${active}/messages?afterCreatedAt=${qs}`,
          { credentials: "include" }
        );
        if (!res.ok || stop) return;
        const j = (await res.json()) as { messages?: MessageRow[]; peerTyping?: boolean };

        setPeerTyping(Boolean(j.peerTyping));

        const inc = j.messages ?? [];
        const theirs = viewerId ? inc.filter((m) => m.senderId !== viewerId) : inc;

        if (theirs.length) {
          await fetch(`/api/conversations/${active}/read`, {
            method: "POST",
            credentials: "include"
          }).catch(() => undefined);

          setRows((r) => r.map((x) => (x.id === active ? { ...x, unread: 0 } : x)));
        }

        if (!inc.length) return;

        setMsgs((prev) => {
          const map = new Map<string, MessageRow>();
          [...prev, ...inc].forEach((m) => map.set(m.id, m));
          const merged = sortAsc([...map.values()]);
          since.current = merged.at(-1)?.createdAt ?? since.current;
          queueMicrotask(() =>
            body.current?.scrollTo({
              top: body.current.scrollHeight,
              behavior: merged.length !== prev.length ? "smooth" : "auto"
            })
          );
          return merged;
        });
      } catch {}
    }

    const id = window.setInterval(() => void tick(), 4200);
    return () => {
      stop = true;
      window.clearInterval(id);
    };
  }, [active, open, viewerId]);

  function pingTyping() {
    if (!active) return;
    const now = Date.now();
    if (now - typingAt.current < 2200) return;
    typingAt.current = now;
    void fetch(`/api/conversations/${active}/typing`, {
      method: "POST",
      credentials: "include"
    }).catch(() => undefined);
  }

  function tapRow(id: string) {
    setActive(id);
    setPane("chat");
    setText("");
    setFiles([]);
    void open(id).catch(() => toast.error("Could not open lane."));
  }

  async function deleteMessage(messageId: string) {
    if (!active) return;
    try {
      const res = await fetch(
        `/api/conversations/${active}/messages/${messageId}`,
        { method: "DELETE", credentials: "include" }
      );
      if (!res.ok) throw new Error("delete");
      const j = (await res.json()) as { message?: MessageRow };
      if (j.message) {
        setMsgs((prev) => prev.map((m) => (m.id === messageId ? j.message! : m)));
      }
    } catch {
      toast.error("Could not delete message");
    }
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();

    const t = text.trim();
    if (!t && files.length === 0) return;

    if (!active || !viewerId) return;

    try {
      if (files.length) {
        const fd = new FormData();
        fd.append("content", t);
        files.forEach((f) => fd.append("files", f));
        const res = await fetch(`/api/conversations/${active}/messages`, {
          method: "POST",
          credentials: "include",
          body: fd
        });

        if (!res.ok) throw new Error("mp");
        await open(active, false);
        await list();
      } else {
        const res = await fetch(`/api/conversations/${active}/messages`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content: t })
        });

        if (!res.ok) throw new Error("json");
        const j = (await res.json()) as { message?: MessageRow };
        if (!j.message) throw new Error("shape");

        setMsgs((prev) => {
          const merged = sortAsc([...prev, j.message!]);
          since.current = merged.at(-1)?.createdAt ?? since.current;
          return merged;
        });
        await list();
      }

      setText("");
      setFiles([]);
    } catch {

      toast.error("Send rejected.");
    }
  }

  if (status === "loading") {

    return <p className="text-sm text-muted-foreground">Loading inbox…</p>;
  }


  if (!session?.user) return null;


  if (session.user.role === Role.ADMIN) {
    return (
      <Card className="p-6">
        <CardTitle className="text-base">Messaging</CardTitle>
        <CardDescription>Administrators bypass this freelancer surface.</CardDescription>
      </Card>
    );
  }

  const q = filter.trim().toLowerCase();


  const view = rows.filter((r) =>
    !q ||
    r.projectTitle.toLowerCase().includes(q) ||
    r.peer.name.toLowerCase().includes(q) ||
    r.lastMessagePreview.toLowerCase().includes(q)


  );

  const cur = view.find((r) => r.id === active) ?? rows.find((r) => r.id === active);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Proposal threads with clients and freelancers.
          </p>
        </div>
        <NewConversationPanel />
      </div>

      <div className="grid h-[min(720px,calc(100vh-10rem))] gap-4 md:h-[calc(100vh-12rem)] md:grid-cols-[288px,minmax(0,1fr)]">
        <Card
          className={cn(
            "flex min-h-[300px] flex-col overflow-hidden p-0",
            active && pane === "chat" ? "hidden md:flex" : "flex"
          )}
        >
          <CardHeader className="space-y-2 border-b px-4 py-3">
            <CardTitle className="text-base">Conversations</CardTitle>
            <CardDescription>Threads map 1:1 to proposals for strict RBAC.</CardDescription>
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search title or person…"
            />
          </CardHeader>
          <div className="flex-1 divide-y overflow-y-auto">
            {view.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => tapRow(r.id)}
                className={cn(
                  "flex w-full flex-col gap-1 px-4 py-3 text-left hover:bg-accent/70",
                  active === r.id && "bg-primary/10"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{r.projectTitle}</span>
                  {r.unread ? (
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] text-primary-foreground">
                      {r.unread > 99 ? "99+" : r.unread}
                    </span>
                  ) : null}
                </div>
                <span className="text-xs text-muted-foreground">{r.peer.name}</span>
                <span className="line-clamp-2 text-[13px] text-muted-foreground">
                  {r.lastMessagePreview || "No copy yet."}
                </span>
              </button>
            ))}
            {!view.length ? (
              <div className="space-y-2 px-4 py-10 text-center text-sm text-muted-foreground">
                <p className="font-medium text-foreground">No conversations yet.</p>
                <p>
                  Start a conversation by messaging a freelancer or client from their profile or project page.
                </p>
              </div>
            ) : null}
          </div>
        </Card>

        <Card
          className={cn(
            "flex min-h-0 flex-col overflow-hidden p-0 md:min-h-[300px]",
            active && pane === "chat" ? "flex" : "hidden md:flex"
          )}
        >
          <CardHeader className="shrink-0 border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9 md:hidden"
                onClick={() => setPane("list")}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <CardTitle className="truncate text-base">
                  {cur?.peer.name ?? "Select a thread"}
                </CardTitle>
                <CardDescription className="truncate">{cur?.projectTitle}</CardDescription>
              </div>
            </div>
          </CardHeader>

          {!active ? (
            <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Pick a conversation to hydrate the composer.
            </div>
          ) : (
            <>
              <div
                ref={body}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain bg-muted/30 px-3 py-4 pb-6"
              >
                {msgs.map((m) => {
                  const mine = m.senderId === viewerId;
                  const deleted = m.isDeleted;
                  return (
                    <div
                      key={m.id}
                      className={cn("group flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm sm:max-w-[70%]",
                          deleted && "italic opacity-80",
                          mine
                            ? deleted
                              ? "rounded-br-md border bg-muted text-muted-foreground"
                              : "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-card"
                        )}
                      >
                        {!mine ? (
                          <p className="text-[11px] font-semibold text-muted-foreground">
                            {m.senderName}
                          </p>
                        ) : null}
                        <p className="whitespace-pre-wrap break-words">{m.content}</p>
                        {mine && !deleted ? (
                          <button
                            type="button"
                            aria-label="Delete message"
                            className="absolute -left-8 top-1 rounded p-1 opacity-0 transition group-hover:opacity-100 hover:bg-muted"
                            onClick={() => void deleteMessage(m.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        ) : null}
                        <p className={cn("text-[11px]", mine ? "opacity-80" : "text-muted-foreground")}>
                          {new Date(m.createdAt).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit"
                          })}
                        </p>
                        {m.attachments.length ? (
                          <ul className="mt-2 space-y-1 text-[12px]">
                            {m.attachments.map((a) => (
                              <li key={a.id} className="rounded border border-white/30 px-2 py-1">
                                {a.mimeType.startsWith("image/") ? (
                                  <a href={`/api/uploads/${a.id}`} target="_blank" rel="noreferrer">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`/api/uploads/${a.id}`}
                                      alt={a.name}
                                      className="mt-1 max-h-40 max-w-full rounded-md object-contain"
                                    />
                                  </a>
                                ) : (
                                  <>
                                    {a.name} · {(a.sizeBytes / 1024).toFixed(1)} KB
                                    <Link
                                      href={`/api/uploads/${a.id}`}
                                      className="ml-2 underline"
                                      target="_blank"
                                      rel="noreferrer"
                                    >
                                      Open
                                    </Link>
                                  </>
                                )}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {peerTyping ? (
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {cur?.peer.name} is typing…
                  </p>
                ) : null}
              </div>

              <div className="shrink-0 border-t bg-card px-4 py-3 safe-area-pb">
                <form className="space-y-2" onSubmit={(e) => void send(e)}>
                  <textarea
                    className="min-h-[72px] max-h-[140px] w-full resize-y rounded-xl border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-[80px]"
                    maxLength={8000}
                    value={text}
                    onChange={(e) => {
                      setText(e.target.value);
                      pingTyping();
                    }}
                    placeholder="Message"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        pingTyping();
                        filesRef.current?.click();
                      }}
                    >
                      <Paperclip className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    <Button type="submit" size="sm">
                      Send
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {files.length
                      ? files.map((f) => f.name).join(", ")
                      : "Images / PDF / DOC · 10MB · max 6"}
                  </p>
                  <input
                    ref={filesRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx"
                    onChange={(e) => {
                      const picked = [...(e.target.files ?? [])];
                      e.target.value = "";
                      const bad = picked.find((f) => f.size > 10 * 1024 * 1024);
                      if (bad) toast.error(`${bad.name} too large`);
                      setFiles(
                        bad ? picked.filter((f) => f !== bad).slice(0, 6) : picked.slice(0, 6)
                      );
                      pingTyping();
                    }}
                  />
                </form>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
