"use client";

import { useEffect, useState } from "react";
import { Forward, RefreshCw, Reply, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MailEnvelope } from "@/types/mail";

interface InboxListProps {
  folder: "INBOX" | "OUTBOX" | "ARCHIV";
  refreshToken?: number;
  selectedUid: number | null;
  onSelect: (uid: number) => void;
  onReply?: (mail: MailEnvelope) => void;
  onForward?: (mail: MailEnvelope) => void;
  onArchive?: (mail: MailEnvelope) => void;
}

function extractTicketNumber(subject: string): string | null {
  const normalized = subject ?? "";

  // Supports common patterns like:
  // [Ticket #12345], Ticket: 12345, UC-12345, INC12345, #12345
  const patterns = [
    /\b(?:ticket|case|uc|inc|req)[\s:_-]*#?(\d{3,})\b/i,
    /\B#(\d{3,})\b/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

function groupEmailsByTicket(emails: MailEnvelope[]) {
  const groups = new Map<string, MailEnvelope[]>();

  for (const email of emails) {
    const ticketNumber = extractTicketNumber(email.subject);
    const key = ticketNumber ? `Ticket #${ticketNumber}` : "Ohne Ticketnummer";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(email);
  }

  return Array.from(groups.entries()).map(([groupTitle, items]) => ({
    groupTitle,
    items,
  }));
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday ? d.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : d.toLocaleDateString("de-DE", { day: "2-digit", month: "short" });
}

export function InboxList({
  folder,
  refreshToken = 0,
  selectedUid,
  onSelect,
  onReply,
  onForward,
  onArchive,
}: InboxListProps) {
  const [emails, setEmails] = useState<MailEnvelope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchEmails() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/emails/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: 1, pageSize: 20, folder }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fehler beim Laden");
      setEmails(data.emails || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEmails();
  }, [folder, refreshToken]);

  const unreadCount = emails.filter((mail) => !mail.flags.includes("\\Seen")).length;
  const groupedEmails = groupEmailsByTicket(emails);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-[var(--border)] bg-[#f8fbff] px-3 py-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">
            {folder === "INBOX" ? "Eingang" : folder === "OUTBOX" ? "Ausgang" : "Archiv"}
          </p>
          <Badge variant="outline">{unreadCount} neu</Badge>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={fetchEmails}
          aria-label="Inbox aktualisieren"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="h-full">
        <div className="flex flex-col gap-1 p-3">
          {emails.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--border)] p-8 text-center text-sm text-muted-foreground">
              Keine E-Mails
            </div>
          ) : (
            groupedEmails.map(({ groupTitle, items }) => (
              <div key={groupTitle} className="mb-2">
                <div className="mb-1 flex items-center justify-between px-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {groupTitle}
                  </p>
                  <Badge variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-1">
                  {items.map((email) => {
                    const isUnread = !email.flags.includes("\\Seen");
                    const isSelected = selectedUid === email.uid;
                    return (
                      <div
                        key={email.uid}
                        className={cn(
                          "group relative rounded-xl border border-transparent bg-white transition-all hover:border-[#c9ddff] hover:bg-[#f3f8ff]",
                          isSelected && "border-[#8db7ff] bg-[#eaf3ff] shadow-sm ring-1 ring-[#bfd8ff]"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(email.uid)}
                          className={cn("flex w-full flex-col gap-1 px-3 py-2.5 pb-11 text-left", isUnread && "font-medium")}
                        >
                          <div className="flex items-start justify-between gap-2 pr-16">
                            <span className="truncate text-sm">{email.from}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatDate(email.date)}
                            </span>
                          </div>
                          <p className="truncate text-sm text-muted-foreground">
                            {email.subject}
                          </p>
                        </button>
                        <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center gap-1.5 opacity-0 transition-all duration-150 group-hover:opacity-100 group-hover:pointer-events-auto">
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="h-7 w-7 rounded-md border border-[#b8d4ff] bg-[#e9f2ff] text-[#0f6cbd] hover:bg-[#dbeaff]"
                            aria-label="Antworten"
                            onClick={() => onReply?.(email)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="h-7 w-7 rounded-md border border-[#c7b8ff] bg-[#f0ebff] text-[#5b3fb9] hover:bg-[#e3dbff]"
                            aria-label="Weiterleiten"
                            onClick={() => onForward?.(email)}
                          >
                            <Forward className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            size="icon-xs"
                            variant="ghost"
                            className="ml-auto h-7 w-7 rounded-md border border-[#ffc8c8] bg-[#ffecec] text-[#c23934] hover:bg-[#ffdede]"
                            aria-label={folder === "ARCHIV" ? "Löschen dauerhaft" : "Archivieren"}
                            title={folder === "ARCHIV" ? "Löschen dauerhaft" : "Archivieren"}
                            onClick={() => onArchive?.(email)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
