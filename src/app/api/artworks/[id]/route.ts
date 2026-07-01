import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, isValidSession } from "@/lib/auth";
import { ARTWORK_BUCKET, getSupabaseAdmin } from "@/lib/supabase";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = request.cookies.get(AUTH_COOKIE)?.value;
  if (!isValidSession(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = getSupabaseAdmin();

  const { data: artwork, error: fetchError } = await admin
    .from("artworks")
    .select("storage_path")
    .eq("id", id)
    .single();

  if (fetchError || !artwork) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await admin.storage.from(ARTWORK_BUCKET).remove([artwork.storage_path]);
  const { error: deleteError } = await admin
    .from("artworks")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
