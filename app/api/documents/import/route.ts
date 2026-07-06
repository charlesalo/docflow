import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getExtension, isSupportedImportFile, fileTextToDocumentHtml, SUPPORTED_IMPORT_EXTENSIONS } from "@/lib/import";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!isSupportedImportFile(file.name)) {
    return NextResponse.json(
      { error: `Unsupported file type. Only ${SUPPORTED_IMPORT_EXTENSIONS.join(", ")} files are supported.` },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "File is too large (2MB max)" }, { status: 400 });
  }

  const text = await file.text();
  const extension = getExtension(file.name);
  const html = fileTextToDocumentHtml(text, extension);
  const title = file.name.replace(/\.[^/.]+$/, "") || "Imported document";

  const document = await prisma.document.create({
    data: { title, ownerId: user.id, content: html },
  });

  return NextResponse.json({ document }, { status: 201 });
}
