import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth/options";
import { insertProjectAttachmentMetadata } from "@/lib/projects/attachment-write";
import { getClientProfileIdForUser } from "@/lib/projects/service";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== Role.CLIENT) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId } = await params;
  const clientId = await getClientProfileIdForUser(session.user.id);
  if (!clientId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files" }, { status: 400 });
  }
  if (files.length > 12) {
    return NextResponse.json({ error: "Too many files" }, { status: 400 });
  }

  const created: string[] = [];
  for (const file of files) {
    const res = await insertProjectAttachmentMetadata({
      projectId,
      clientProfileId: clientId,
      userId: session.user.id,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size
    });
    if (!res.ok) {
      return NextResponse.json({ error: res.error }, { status: res.error === "Not found" ? 404 : 400 });
    }
    created.push(res.id);
  }

  revalidatePath("/dashboard/projects");
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/edit`);

  return NextResponse.json({ ok: true, ids: created }, { status: 201 });
}
