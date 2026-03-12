import { NextResponse } from "next/server";
import { deleteEmail } from "@/lib/imap";
import { removeCachedEmail } from "@/lib/mail-cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const uid = Number(body?.uid);
    const fromFolder = String(body?.fromFolder || "ARCHIV");

    if (!uid || Number.isNaN(uid)) {
      return NextResponse.json({ error: "Ungültige UID" }, { status: 400 });
    }

    await deleteEmail(uid, fromFolder);
    await removeCachedEmail(uid, fromFolder);
    return NextResponse.json({ ok: true, uid, fromFolder });
  } catch (error) {
    console.error("Delete email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Löschen fehlgeschlagen" },
      { status: 500 }
    );
  }
}
