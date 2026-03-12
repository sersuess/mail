import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getImapConfig } from "./mail-config";
import type { MailEnvelope, MailMessage } from "@/types/mail";

function createClient() {
  const config = getImapConfig();
  return new ImapFlow(config);
}

function formatFromAddress(envelope: { from?: Array<{ address?: string; name?: string }> }): string {
  const from = envelope.from?.[0];
  if (!from) return "";
  return from.name ? `${from.name} <${from.address}>` : from.address || "";
}

function matchesFolder(path: string, wanted: string) {
  const p = path.toLowerCase();
  const w = wanted.toLowerCase();
  return p === w || p.includes(w);
}

async function resolveFolderPath(
  client: ImapFlow,
  folder: "INBOX" | "OUTBOX" | "ARCHIV" | string
): Promise<string> {
  if (folder.toUpperCase() === "INBOX") return "INBOX";

  const list = await client.list();

  if (folder.toUpperCase() === "OUTBOX") {
    const bySpecial = list.find((box) => box.specialUse === "\\Sent");
    if (bySpecial) return bySpecial.path;
    const byName = list.find((box) =>
      ["sent", "gesendet", "outbox"].some((name) => matchesFolder(box.path, name))
    );
    return byName?.path || "INBOX";
  }

  if (folder.toUpperCase() === "ARCHIV") {
    const bySpecial = list.find((box) => box.specialUse === "\\Archive");
    if (bySpecial) return bySpecial.path;
    const byName = list.find((box) =>
      ["archiv", "archive"].some((name) => matchesFolder(box.path, name))
    );
    return byName?.path || "Archiv";
  }

  const direct = list.find((box) => box.path === folder);
  if (direct) return direct.path;
  return folder;
}

function mapMessagesToEnvelope(messages: Array<{
  uid: number;
  envelope?: { subject?: string; from?: Array<{ address?: string; name?: string }>; date?: Date };
  flags?: Set<string>;
}>): MailEnvelope[] {
  const result: MailEnvelope[] = [];
  for (const msg of messages) {
    result.push({
      uid: msg.uid,
      subject: msg.envelope?.subject || "(Kein Betreff)",
      from: formatFromAddress(msg.envelope || {}),
      date: msg.envelope?.date ? new Date(msg.envelope.date).toISOString() : "",
      flags: msg.flags ? Array.from(msg.flags) : [],
    });
  }
  return result.reverse();
}

export async function listFolderEmails(folder: "INBOX" | "OUTBOX" | "ARCHIV" | string, limit = 20): Promise<MailEnvelope[]> {
  const client = createClient();

  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    const lock = await client.getMailboxLock(folderPath);

    try {
      const mailbox = client.mailbox;
      if (!mailbox || mailbox.exists === 0) return [];

      const maxExists = Number(mailbox.exists || 0);
      const safeLimit = Math.max(1, limit);
      const startSeq = safeLimit >= maxExists ? 1 : Math.max(1, maxExists - safeLimit + 1);
      const range = `${startSeq}:*`;
      const messages = await client.fetchAll(range, {
        envelope: true,
        flags: true,
      });
      return mapMessagesToEnvelope(messages);
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    client.close();
  }
}

export async function listEmails(limit = 50): Promise<MailEnvelope[]> {
  return listFolderEmails("INBOX", limit);
}

export async function listMailboxes(): Promise<string[]> {
  const client = createClient();
  try {
    await client.connect();
    const boxes = await client.list();
    return boxes.map((box) => box.path);
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    client.close();
  }
}

export async function listInboxEmails(page = 1, pageSize = 20): Promise<MailEnvelope[]> {
  const safePage = Math.max(1, page);
  const safePageSize = Math.max(1, Math.min(100, pageSize));
  const limit = safePage * safePageSize;
  const allUntilPage = await listFolderEmails("INBOX", limit);
  const start = (safePage - 1) * safePageSize;
  return allUntilPage.slice(start, start + safePageSize);
}

export async function getEmail(uid: number, folder: "INBOX" | "OUTBOX" | "ARCHIV" | string = "INBOX"): Promise<MailMessage | null> {
  const client = createClient();

  try {
    await client.connect();
    const folderPath = await resolveFolderPath(client, folder);
    const lock = await client.getMailboxLock(folderPath);

    try {
      const msg = await client.fetchOne(String(uid), { source: true }, { uid: true });
      if (!msg || !msg.source) return null;

      const parsed = await simpleParser(msg.source);
      const envelope = msg.envelope || {};

      return {
        uid: msg.uid,
        subject: envelope.subject || "(Kein Betreff)",
        from: formatFromAddress(envelope),
        date: envelope.date ? new Date(envelope.date).toISOString() : "",
        flags: msg.flags ? Array.from(msg.flags) : [],
        html: parsed.html || undefined,
        text: parsed.text || undefined,
      };
    } finally {
      lock.release();
    }
  } catch {
    return null;
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    client.close();
  }

  return null;
}

export async function archiveEmail(uid: number, fromFolder: "INBOX" | "OUTBOX" | "ARCHIV" | string = "INBOX"): Promise<void> {
  const client = createClient();

  try {
    await client.connect();
    const sourcePath = await resolveFolderPath(client, fromFolder);
    const archivePath = await resolveFolderPath(client, "ARCHIV");

    if (archivePath === "Archiv") {
      try {
        await client.mailboxCreate("Archiv");
      } catch {
        /* ignore if exists */
      }
    }

    const lock = await client.getMailboxLock(sourcePath);
    try {
      const finalArchivePath = await resolveFolderPath(client, "ARCHIV");
      try {
        await client.messageMove(String(uid), finalArchivePath, { uid: true });
      } catch {
        await client.messageCopy(String(uid), finalArchivePath, { uid: true });
        await client.messageDelete(String(uid), { uid: true });
      }
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    client.close();
  }
}

export async function deleteEmail(uid: number, fromFolder: "INBOX" | "OUTBOX" | "ARCHIV" | string = "ARCHIV"): Promise<void> {
  const client = createClient();
  try {
    await client.connect();
    const sourcePath = await resolveFolderPath(client, fromFolder);
    const lock = await client.getMailboxLock(sourcePath);
    try {
      await client.messageDelete(String(uid), { uid: true });
      try {
        await client.mailboxClose();
      } catch {
        /* ignore close errors */
      }
    } finally {
      lock.release();
    }
  } finally {
    try {
      await client.logout();
    } catch {
      /* ignore */
    }
    client.close();
  }
}
