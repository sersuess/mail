import { NextResponse } from "next/server";
import { archiveEmail } from "@/lib/imap";
import { moveCachedEmail } from "@/lib/mail-cache";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const uid = Number(body?.uid);
    const fromFolder = String(body?.fromFolder || "INBOX");

    if (!uid || Number.isNaN(uid)) {
      return NextResponse.json({ error: "Ungültige UID" }, { status: 400 });
    }

    await archiveEmail(uid, fromFolder);
    await moveCachedEmail(uid, fromFolder, "ARCHIV");

    return NextResponse.json({ ok: true, uid, fromFolder, toFolder: "ARCHIV" });
  } catch (error) {
    console.error("Archive email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Archivieren fehlgeschlagen" },
      { status: 500 }
    );
  }
}
