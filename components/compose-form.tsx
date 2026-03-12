"use client";

import { useEffect, useState } from "react";
import { PenSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export interface ComposeDraft {
  to?: string;
  subject?: string;
  body?: string;
}

interface ComposeFormProps {
  onSent?: () => void;
  draft?: ComposeDraft | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

export function ComposeForm({
  onSent,
  draft,
  open,
  onOpenChange,
  hideTrigger = false,
}: ComposeFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const isControlled = typeof open === "boolean";
  const sheetOpen = isControlled ? open : internalOpen;

  const setSheetOpen = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  useEffect(() => {
    if (!draft) return;
    setTo(draft.to ?? "");
    setSubject(draft.subject ?? "");
    setBody(draft.body ?? "");
  }, [draft]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !subject.trim() || !body.trim()) {
      setError("Alle Felder sind erforderlich.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/emails/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim(), subject: subject.trim(), text: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Senden fehlgeschlagen");
      setTo("");
      setSubject("");
      setBody("");
      setSheetOpen(false);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      {!hideTrigger && (
        <Button type="button" onClick={() => setSheetOpen(true)} className="h-10 rounded-xl px-4 shadow-sm">
          <PenSquare className="h-4 w-4" />
          Verfassen
        </Button>
      )}
      <SheetContent side="center" className="flex min-h-0 flex-col border-[var(--border)] p-0">
        <SheetHeader className="shrink-0 border-b border-[var(--border)] px-6 py-5">
          <SheetTitle className="text-xl">Neue E-Mail</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
            <div className="space-y-5">
              <div>
            <label htmlFor="to" className="mb-2 block text-sm font-medium">
              An
            </label>
            <Input
              id="to"
              type="email"
              placeholder="empfaenger@beispiel.de"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="h-10 rounded-xl"
              required
            />
              </div>
              <div>
            <label htmlFor="subject" className="mb-2 block text-sm font-medium">
              Betreff
            </label>
            <Input
              id="subject"
              placeholder="Betreff"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-10 rounded-xl"
              required
            />
              </div>
              <div className="flex flex-col">
            <label htmlFor="body" className="mb-2 block text-sm font-medium">
              Nachricht
            </label>
            <Textarea
              id="body"
              placeholder="Nachricht..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[320px] resize-y rounded-xl"
              required
            />
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-fit rounded-xl px-5">
              {!loading && <Send className="h-4 w-4" />}
              {loading ? "Wird gesendet…" : "Senden"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
