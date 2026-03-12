import { NextResponse } from "next/server";
import { listFolderEmails } from "@/lib/imap";
import { getCachedFolderEmails, setCachedFolderEmails } from "@/lib/mail-cache";

export const runtime = "nodejs";

const CACHE_TTL_MS = 60_000;

function paginate<T>(items: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const page = Number(body?.page ?? 1);
    const pageSize = Number(body?.pageSize ?? 20);
    const folder = String(body?.folder ?? "INBOX");

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, Math.min(100, pageSize));
    const requiredCount = safePage * safePageSize;

    const cachedFresh = await getCachedFolderEmails(folder, CACHE_TTL_MS);
    if (cachedFresh) {
      return NextResponse.json({
        page: safePage,
        pageSize: safePageSize,
        folder,
        source: "cache",
        emails: paginate(cachedFresh, safePage, safePageSize),
      });
    }

    const cachedStale = await getCachedFolderEmails(folder, CACHE_TTL_MS, true);
    if (cachedStale) {
      void listFolderEmails(folder, requiredCount)
        .then((fresh) => setCachedFolderEmails(folder, fresh))
        .catch(() => undefined);

      return NextResponse.json({
        page: safePage,
        pageSize: safePageSize,
        folder,
        source: "stale-cache",
        emails: paginate(cachedStale, safePage, safePageSize),
      });
    }

    const fresh = await listFolderEmails(folder, requiredCount);
    await setCachedFolderEmails(folder, fresh);
    return NextResponse.json({
      page: safePage,
      pageSize: safePageSize,
      folder,
      source: "imap",
      emails: paginate(fresh, safePage, safePageSize),
    });
  } catch (error) {
    console.error("Inbox list error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Fehler beim Abrufen der Inbox" },
      { status: 500 }
    );
  }
}
