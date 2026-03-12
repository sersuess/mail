import { NextResponse } from "next/server";
import { getEmail } from "@/lib/imap";
import { getCachedEmailDetail, setCachedEmailDetail } from "@/lib/mail-cache";

export const runtime = "nodejs";

const DETAIL_CACHE_TTL_MS = 5 * 60_000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const folder = new URL(request.url).searchParams.get("folder") || "INBOX";
    const uidNum = parseInt(uid, 10);
    if (isNaN(uidNum)) {
      return NextResponse.json({ error: "Ungültige UID" }, { status: 400 });
    }

    const cached = await getCachedEmailDetail(folder, uidNum, DETAIL_CACHE_TTL_MS);
    if (cached) {
      return NextResponse.json(cached);
    }

    const email = await getEmail(uidNum, folder);
    if (!email) {
      return NextResponse.json({ error: "E-Mail nicht gefunden" }, { status: 404 });
    }
    await setCachedEmailDetail(folder, uidNum, email);
    return NextResponse.json(email);
  } catch (error) {
    console.error("Read email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Abrufen der E-Mail" },
      { status: 500 }
    );
  }
}
