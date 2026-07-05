import { NextRequest, NextResponse } from "next/server";
import { deleteArtwork } from "@/lib/blob-store";

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  await deleteArtwork(id);
  return NextResponse.json({ ok: true });
}
