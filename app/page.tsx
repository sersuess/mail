"use client";

import { useState } from "react";
import { InboxList } from "@/components/inbox-list";
import { EmailViewer } from "@/components/email-viewer";
import { ComposeDraft, ComposeForm } from "@/components/compose-form";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Archive, Inbox, Mail, Send } from "lucide-react";
import type { MailEnvelope, MailMessage } from "@/types/mail";

function extractEmailAddress(from: string): string {
  const match = from.match(/<([^>]+)>/);
  if (match?.[1]) return match[1];
  return from.trim();
}

function buildReplyDraft(mail: Pick<MailEnvelope, "from" | "subject">): ComposeDraft {
  const to = extractEmailAddress(mail.from);
  const subject = mail.subject.toLowerCase().startsWith("re:")
    ? mail.subject
    : `Re: ${mail.subject}`;
  return { to, subject, body: "\n\n---\n" };
}

function buildForwardDraft(mail: Pick<MailEnvelope, "subject"> & { text?: string }): ComposeDraft {
  const subject = mail.subject.toLowerCase().startsWith("fwd:")
    ? mail.subject
    : `Fwd: ${mail.subject}`;
  const body = `\n\n--- Weitergeleitete Nachricht ---\n${mail.text ?? ""}`;
  return { to: "", subject, body };
}

export default function Home() {
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"INBOX" | "OUTBOX" | "ARCHIV">("INBOX");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDraft, setComposeDraft] = useState<ComposeDraft | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const handleReplyFromList = (mail: MailEnvelope) => {
    setComposeDraft(buildReplyDraft(mail));
    setComposeOpen(true);
  };

  const handleForwardFromList = (mail: MailEnvelope) => {
    setComposeDraft(buildForwardDraft(mail));
    setComposeOpen(true);
  };

  const handleReplyFromDetail = (mail: MailMessage) => {
    setComposeDraft(buildReplyDraft(mail));
    setComposeOpen(true);
  };

  const handleForwardFromDetail = (mail: MailMessage) => {
    setComposeDraft(buildForwardDraft(mail));
    setComposeOpen(true);
  };

  const handleArchiveFromList = async (mail: MailEnvelope) => {
    const endpoint = activeTab === "ARCHIV" ? "/api/emails/delete" : "/api/emails/archive";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: mail.uid, fromFolder: activeTab }),
    });
    if (selectedUid === mail.uid) setSelectedUid(null);
    setRefreshToken((prev) => prev + 1);
  };

  const handleArchiveFromDetail = async (mail: MailMessage) => {
    const endpoint = activeTab === "ARCHIV" ? "/api/emails/delete" : "/api/emails/archive";
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: mail.uid, fromFolder: activeTab }),
    });
    if (selectedUid === mail.uid) setSelectedUid(null);
    setRefreshToken((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-50 p-3 md:p-6 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-2xl md:h-[calc(100vh-3rem)]">
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">MRT Mail</h1>
              <p className="text-xs text-muted-foreground">Modern Inbox Workspace</p>
            </div>
            <Badge variant="secondary" className="ml-1 hidden sm:inline-flex">
              shadcn/ui
            </Badge>
          </div>
          <ComposeForm
            open={composeOpen}
            onOpenChange={setComposeOpen}
            draft={composeDraft}
            onSent={() => {
              setSelectedUid(null);
              setComposeDraft(null);
              setRefreshToken((prev) => prev + 1);
            }}
          />
        </header>
        <div className="flex min-h-0 flex-1">
          <aside className="w-[420px] shrink-0 border-r border-[var(--border)] bg-background/70">
            <div className="border-b border-[var(--border)] bg-[#f8fbff] px-3 py-1.5">
              <Tabs
                value={activeTab}
                onValueChange={(value) => {
                  setActiveTab(value as "INBOX" | "OUTBOX" | "ARCHIV");
                  setSelectedUid(null);
                }}
                className="w-full"
              >
                <TabsList className="w-full" variant="line">
                  <TabsTrigger value="INBOX" className="gap-2">
                    <Inbox className="h-4 w-4" />
                    Eingang
                  </TabsTrigger>
                  <TabsTrigger value="OUTBOX" className="gap-2">
                    <Send className="h-4 w-4" />
                    Ausgang
                  </TabsTrigger>
                  <TabsTrigger value="ARCHIV" className="gap-2">
                    <Archive className="h-4 w-4" />
                    Archiv
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <InboxList
              folder={activeTab}
              refreshToken={refreshToken}
              selectedUid={selectedUid}
              onSelect={setSelectedUid}
              onReply={handleReplyFromList}
              onForward={handleForwardFromList}
              onArchive={handleArchiveFromList}
            />
          </aside>
          <main className="min-w-0 flex-1 bg-gradient-to-b from-background to-background/70">
            <EmailViewer
              folder={activeTab}
              uid={selectedUid}
              onReply={handleReplyFromDetail}
              onForward={handleForwardFromDetail}
              onArchive={handleArchiveFromDetail}
            />
          </main>
        </div>
      </div>
    </div>
  );
}
