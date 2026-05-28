"use client";

import Image from "next/image";
import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createPortfolioItemAction,
  deletePortfolioItemAction,
  updatePortfolioItemAction
} from "@/lib/portfolio/actions";

export type PortfolioItemRow = {
  id: string;
  title: string;
  description: string | null;
  projectUrl: string | null;
  imageUrl: string | null;
};

export function PortfolioManager({ initial }: { initial: PortfolioItemRow[] }) {
  const [items, setItems] = React.useState(initial);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [showForm, setShowForm] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  async function saveItem(e: React.FormEvent<HTMLFormElement>, itemId?: string) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") ?? ""),
      description: String(fd.get("description") ?? ""),
      projectUrl: String(fd.get("projectUrl") ?? "")
    };
    const res = itemId
      ? await updatePortfolioItemAction(itemId, payload, fd)
      : await createPortfolioItemAction(payload, fd);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(itemId ? "Portfolio updated" : "Portfolio item added");
    setShowForm(false);
    setEditingId(null);
    window.location.reload();
  }

  async function remove(id: string) {
    if (!confirm("Delete this portfolio item?")) return;
    setPending(true);
    const res = await deletePortfolioItemAction(id);
    setPending(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setItems((prev) => prev.filter((i) => i.id !== id));
    toast.success("Removed");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold">Portfolio</h3>
          <p className="text-xs text-muted-foreground">
            Showcase projects with images, descriptions, and links.
          </p>
        </div>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowForm((v) => !v)}>
          <Plus className="mr-2 h-4 w-4" />
          Add item
        </Button>
      </div>

      {showForm ? (
        <PortfolioForm onSubmit={(e) => void saveItem(e)} pending={pending} onCancel={() => setShowForm(false)} />
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) =>
          editingId === item.id ? (
            <li key={item.id} className="rounded-xl border p-4">
              <PortfolioForm
                initial={item}
                onSubmit={(e) => void saveItem(e, item.id)}
                pending={pending}
                onCancel={() => setEditingId(null)}
              />
            </li>
          ) : (
            <li key={item.id} className="overflow-hidden rounded-xl border bg-card shadow-subtle">
              {item.imageUrl ? (
                <div className="relative aspect-video w-full bg-muted">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="aspect-video w-full bg-gradient-to-br from-violet-500/20 to-cyan-500/15" />
              )}
              <div className="space-y-2 p-4">
                <p className="font-semibold">{item.title}</p>
                {item.description ? (
                  <p className="line-clamp-3 text-sm text-muted-foreground">{item.description}</p>
                ) : null}
                {item.projectUrl ? (
                  <a
                    href={item.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    View project
                  </a>
                ) : null}
                <div className="flex gap-2 pt-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(item.id)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() => void remove(item.id)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            </li>
          )
        )}
      </ul>
      {!items.length && !showForm ? (
        <p className="text-sm text-muted-foreground">No portfolio items yet.</p>
      ) : null}
    </div>
  );
}

function PortfolioForm({
  initial,
  onSubmit,
  pending,
  onCancel
}: {
  initial?: PortfolioItemRow;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  pending: boolean;
  onCancel: () => void;
}) {
  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <div className="space-y-1">
        <Label htmlFor="title">Project title</Label>
        <Input id="title" name="title" defaultValue={initial?.title} required maxLength={120} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" name="description" defaultValue={initial?.description ?? ""} rows={3} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="projectUrl">Project link</Label>
        <Input id="projectUrl" name="projectUrl" type="url" defaultValue={initial?.projectUrl ?? ""} placeholder="https://" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="image">Image</Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
