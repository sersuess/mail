"use client";

import { useEffect, useState } from "react";
import {
  Archive,
  FolderOpen,
  Inbox,
  Send,
  ShieldAlert,
  Trash2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  selectedFolder: string;
  onSelectFolder: (folder: string) => void;
}

function getFolderIcon(folder: string) {
  const normalized = folder.toLowerCase();
  if (normalized.includes("inbox")) return Inbox;
  if (normalized.includes("sent")) return Send;
  if (normalized.includes("draft")) return FileText;
  if (normalized.includes("trash")) return Trash2;
  if (normalized.includes("spam")) return ShieldAlert;
  if (normalized.includes("archive")) return Archive;
  return FolderOpen;
}

export function Sidebar({ selectedFolder, onSelectFolder }: SidebarProps) {
  const [folders, setFolders] = useState<string[]>(["INBOX"]);

  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch("/api/emails/list", { method: "POST" });
        const data = await res.json();
        if (res.ok && Array.isArray(data.folders) && data.folders.length > 0) {
          setFolders(data.folders);
        }
      } catch {
        // fallback to default INBOX
      }
    }
    loadFolders();
  }, []);

  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-background/80">
      <div className="border-b border-[var(--border)] px-3 py-2">
        <p className="text-sm font-medium">Ordner</p>
      </div>
      <ScrollArea className="h-full">
        <div className="space-y-1 p-2">
          {folders.map((folder) => (
            (() => {
              const Icon = getFolderIcon(folder);
              return (
                <Button
                  key={folder}
                  type="button"
                  variant={selectedFolder === folder ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-xl"
                  onClick={() => onSelectFolder(folder)}
                >
                  <Icon className="h-4 w-4" />
                  {folder}
                </Button>
              );
            })()
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
