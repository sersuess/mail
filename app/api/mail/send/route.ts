import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/smtp";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, text, html } = body;

    if (!to || !subject) {
      return NextResponse.json(
        { error: "Empfänger (to) und Betreff (subject) sind erforderlich" },
        { status: 400 }
      );
    }

    if (!text && !html) {
      return NextResponse.json(
        { error: "Text oder HTML-Inhalt ist erforderlich" },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to, subject, text, html });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Send email error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Senden der E-Mail" },
      { status: 500 }
    );
  }
}
