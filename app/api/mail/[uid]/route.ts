import { NextResponse } from "next/server";
import { getEmail } from "@/lib/imap";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  try {
    const { uid } = await params;
    const uidNum = parseInt(uid, 10);
    if (isNaN(uidNum)) {
      return NextResponse.json({ error: "Ungültige UID" }, { status: 400 });
    }

    const email = await getEmail(uidNum);
    if (!email) {
      return NextResponse.json({ error: "E-Mail nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json(email);
  } catch (error) {
    console.error("Get email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Abrufen der E-Mail" },
      { status: 500 }
    );
  }
}
