import { NextResponse } from "next/server";
import { listMailboxes } from "@/lib/imap";

export async function POST() {
  try {
    const folders = await listMailboxes();
    return NextResponse.json({ folders });
  } catch (error) {
    console.error("List folders error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Abrufen der Ordner" },
      { status: 500 }
    );
  }
}
