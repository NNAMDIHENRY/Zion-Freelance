"use client";

import Image from "next/image";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import { CategoryMultiSelect } from "@/components/forms/CategoryMultiSelect";
import { SkillsTagInput, type SkillOption } from "@/components/forms/SkillsTagInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfileAction } from "@/lib/profile/actions";

type ProfileEditFormProps = {
  role: Role;
  initial: {
    name: string;
    imageUrl: string | null;
    headline?: string;
    bio?: string;
    hourlyRate?: string;
    availability?: string;
    companyName?: string;
    websiteUrl?: string;
    categorySlugs?: string[];
    skillIds?: string[];
    isPublic?: boolean;
  };
  skills: SkillOption[];
};

export function ProfileEditForm({ role, initial, skills }: ProfileEditFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [name, setName] = React.useState(initial.name);
  const [headline, setHeadline] = React.useState(initial.headline ?? "");
  const [bio, setBio] = React.useState(initial.bio ?? "");
  const [hourlyRate, setHourlyRate] = React.useState(initial.hourlyRate ?? "");
  const [companyName, setCompanyName] = React.useState(initial.companyName ?? "");
  const [websiteUrl, setWebsiteUrl] = React.useState(initial.websiteUrl ?? "");
  const [categorySlugs, setCategorySlugs] = React.useState(initial.categorySlugs ?? []);
  const [skillIds, setSkillIds] = React.useState(initial.skillIds ?? []);
  const [isPublic, setIsPublic] = React.useState(initial.isPublic ?? true);
  const [imageUrl, setImageUrl] = React.useState(initial.imageUrl);

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: fd });
    const j = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok) {
      toast.error(j.error ?? "Upload failed");
      return;
    }
    if (j.url) setImageUrl(j.url);
    toast.success("Avatar updated");
    router.refresh();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      const res = await updateProfileAction({
        name,
        headline,
        bio,
        hourlyRate,
        companyName,
        websiteUrl,
        categorySlugs,
        skillIds,
        isPublic,
        availability: "AVAILABLE"
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Profile saved");
      router.push("/dashboard/profile");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="mx-auto max-w-2xl space-y-8">
      <section className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt="" fill className="object-cover" unoptimized />
          ) : null}
        </div>
        <div>
          <Label htmlFor="avatar">Profile photo</Label>
          <Input id="avatar" type="file" accept="image/*" className="mt-2" onChange={onAvatarChange} />
        </div>
      </section>

      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>

      {role === Role.FREELANCER ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="headline">Headline</Label>
            <Input id="headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} className="min-h-[120px]" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly rate (USD)</Label>
            <Input
              id="hourlyRate"
              value={hourlyRate}
              onChange={(e) => setHourlyRate(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <CategoryMultiSelect value={categorySlugs} onChange={setCategorySlugs} />
          <SkillsTagInput options={skills} value={skillIds} onChange={setSkillIds} />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public profile visible in search
          </label>
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="websiteUrl">Website</Label>
            <Input
              id="websiteUrl"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
            />
          </div>
        </>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
