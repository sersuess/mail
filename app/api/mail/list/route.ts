import { NextResponse } from "next/server";
import { listEmails } from "@/lib/imap";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const emails = await listEmails(limit);
    return NextResponse.json(emails);
  } catch (error) {
    console.error("List emails error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Abrufen der E-Mails" },
      { status: 500 }
    );
  }
}
