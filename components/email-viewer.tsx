"use client";

import { useEffect, useState } from "react";
import { Forward, MailOpen, Reply, Trash2, UserRound } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MailMessage } from "@/types/mail";

interface EmailViewerProps {
  folder: "INBOX" | "OUTBOX" | "ARCHIV";
  uid: number | null;
  onReply?: (mail: MailMessage) => void;
  onForward?: (mail: MailMessage) => void;
  onArchive?: (mail: MailMessage) => void;
}

function formatFullDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function EmailViewer({ folder, uid, onReply, onForward, onArchive }: EmailViewerProps) {
  const [email, setEmail] = useState<MailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setEmail(null);
      return;
    }
    async function fetchEmail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/emails/${uid}?folder=${encodeURIComponent(folder)}`);
        if (!res.ok) throw new Error("E-Mail konnte nicht geladen werden");
        const data = await res.json();
        setEmail(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    }
    fetchEmail();
  }, [uid, folder]);

  if (!uid) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
        <div className="rounded-2xl bg-muted/50 p-4">
          <MailOpen className="h-8 w-8" />
        </div>
        <p className="text-sm">E-Mail auswählen</p>
        <p className="text-xs">Klicken Sie auf eine Nachricht in der Liste</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-7 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Separator />
        <Skeleton className="h-40 w-full rounded" />
      </div>
    );
  }

  if (error || !email) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error || "E-Mail nicht gefunden"}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-[var(--border)] bg-[#f8fbff] px-6 py-4 backdrop-blur">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Badge variant="secondary">Nachricht</Badge>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-9 rounded-lg border border-[#b8d4ff] bg-[#e9f2ff] px-4 text-[#0f6cbd] hover:bg-[#dbeaff]"
              onClick={() => onReply?.(email)}
            >
              <Reply className="h-4 w-4" />
              Antworten
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-[#c7b8ff] bg-[#f0ebff] px-4 text-[#5b3fb9] hover:bg-[#e3dbff]"
              onClick={() => onForward?.(email)}
            >
              <Forward className="h-4 w-4" />
              Weiterleiten
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 rounded-lg border-[#ffc8c8] bg-[#ffecec] px-4 text-[#c23934] hover:bg-[#ffdede]"
              onClick={() => onArchive?.(email)}
            >
              <Trash2 className="h-4 w-4" />
              Löschen
            </Button>
          </div>
        </div>
        <h2 className="text-lg font-semibold tracking-tight">{email.subject}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <UserRound className="h-3.5 w-3.5" /> {email.from}
          </span>
          <span>{formatFullDate(email.date)}</span>
        </div>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="email-body-wrap px-6 py-4">
          {email.html ? (
            <div
              className="email-body text-sm [&_a]:text-primary [&_a]:underline [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: email.html }}
            />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-sm">{email.text || "(Leer)"}</pre>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
