import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { MailEnvelope, MailMessage } from "@/types/mail";

const CACHE_DIR = path.join(process.cwd(), "data");
const CACHE_FILE = path.join(CACHE_DIR, "mail-cache.json");

type FolderCache = {
  updatedAt: number;
  emails: MailEnvelope[];
};

type DetailCache = {
  updatedAt: number;
  email: MailMessage;
};

type MailCache = {
  folders: Record<string, FolderCache>;
  details: Record<string, DetailCache>;
};

const EMPTY_CACHE: MailCache = { folders: {}, details: {} };

function folderKey(folder: string) {
  return (folder || "INBOX").toUpperCase();
}

function detailKey(folder: string, uid: number) {
  return `${folderKey(folder)}:${uid}`;
}

async function readCache(): Promise<MailCache> {
  try {
    const content = await readFile(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(content) as MailCache;
    return {
      folders: parsed.folders || {},
      details: parsed.details || {},
    };
  } catch {
    return EMPTY_CACHE;
  }
}

async function writeCache(cache: MailCache): Promise<void> {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

export async function getCachedFolderEmails(
  folder: string,
  maxAgeMs: number,
  allowStale = false
): Promise<MailEnvelope[] | null> {
  const cache = await readCache();
  const key = folderKey(folder);
  const entry = cache.folders[key];
  if (!entry) return null;
  const age = Date.now() - entry.updatedAt;
  if (age > maxAgeMs && !allowStale) return null;
  return entry.emails;
}

export async function setCachedFolderEmails(folder: string, emails: MailEnvelope[]): Promise<void> {
  const cache = await readCache();
  const key = folderKey(folder);
  cache.folders[key] = { updatedAt: Date.now(), emails };
  await writeCache(cache);
}

export async function getCachedEmailDetail(
  folder: string,
  uid: number,
  maxAgeMs: number
): Promise<MailMessage | null> {
  const cache = await readCache();
  const key = detailKey(folder, uid);
  const entry = cache.details[key];
  if (!entry) return null;
  const age = Date.now() - entry.updatedAt;
  if (age > maxAgeMs) return null;
  return entry.email;
}

export async function setCachedEmailDetail(folder: string, uid: number, email: MailMessage): Promise<void> {
  const cache = await readCache();
  cache.details[detailKey(folder, uid)] = {
    updatedAt: Date.now(),
    email,
  };
  await writeCache(cache);
}

export async function moveCachedEmail(uid: number, fromFolder: string, toFolder: string): Promise<void> {
  const cache = await readCache();
  const fromKey = folderKey(fromFolder);
  const toKey = folderKey(toFolder);

  const fromList = cache.folders[fromKey]?.emails || [];
  const target = fromList.find((mail) => mail.uid === uid) || null;
  const nextFrom = fromList.filter((mail) => mail.uid !== uid);

  cache.folders[fromKey] = {
    updatedAt: Date.now(),
    emails: nextFrom,
  };

  if (target) {
    const toList = cache.folders[toKey]?.emails || [];
    cache.folders[toKey] = {
      updatedAt: Date.now(),
      emails: [target, ...toList.filter((mail) => mail.uid !== uid)],
    };
  } else {
    cache.folders[toKey] = cache.folders[toKey] || {
      updatedAt: Date.now(),
      emails: [],
    };
  }

  const fromDetail = cache.details[detailKey(fromFolder, uid)];
  if (fromDetail) {
    cache.details[detailKey(toFolder, uid)] = {
      updatedAt: Date.now(),
      email: fromDetail.email,
    };
    delete cache.details[detailKey(fromFolder, uid)];
  }

  await writeCache(cache);
}

export async function removeCachedEmail(uid: number, folder: string): Promise<void> {
  const cache = await readCache();
  const key = folderKey(folder);
  const list = cache.folders[key]?.emails || [];
  cache.folders[key] = {
    updatedAt: Date.now(),
    emails: list.filter((mail) => mail.uid !== uid),
  };
  delete cache.details[detailKey(folder, uid)];
  await writeCache(cache);
}
