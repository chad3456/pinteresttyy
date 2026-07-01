import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import { ARTWORK_BUCKET, getSupabaseAdmin } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const session = request.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const extension = file.name.split(".").pop() || "jpg";
  const storagePath = `${randomUUID()}.${extension}`;

  const { error: uploadError } = await admin.storage
    .from(ARTWORK_BUCKET)
    .upload(storagePath, await file.arrayBuffer(), {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { error: insertError } = await admin
    .from("artworks")
    .insert({ title: title || "Untitled", storage_path: storagePath });

  if (insertError) {
    await admin.storage.from(ARTWORK_BUCKET).remove([storagePath]);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
