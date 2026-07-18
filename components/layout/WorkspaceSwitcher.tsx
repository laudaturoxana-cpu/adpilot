"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ChevronDown, Check, Plus } from "lucide-react";
import { toast } from "sonner";
import type { WorkspaceWithRole } from "@/types";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  media_buyer: "Media Buyer",
  strategist: "Strategist",
  creative: "Creative",
  approver: "Approver",
  client: "Client",
  viewer: "Viewer",
};

export function WorkspaceSwitcher() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceWithRole[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) return;
      const { data, current } = await res.json();
      setWorkspaces(data ?? []);
      setCurrentId(current ?? data?.[0]?.id ?? null);
    } catch {
      // silențios — switcher-ul e non-critic
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function switchTo(id: string) {
    if (id === currentId) { setOpen(false); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      if (!res.ok) { toast.error("Nu s-a putut schimba workspace-ul"); return; }
      setCurrentId(id);
      setOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace() {
    const name = prompt("Nume workspace nou:");
    if (!name || !name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        toast.error(error ?? "Nu s-a putut crea workspace-ul");
        return;
      }
      const { data } = await res.json();
      toast.success(`Workspace creat: ${data.name}`);
      await load();
      await switchTo(data.id);
    } finally {
      setBusy(false);
    }
  }

  const current = workspaces.find((w) => w.id === currentId);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          maxWidth: 220,
          padding: "8px 12px",
          borderRadius: "var(--radius-md)",
          background: "var(--bg-elevated)",
          border: "1px solid var(--bg-border)",
          color: "var(--text-primary)",
          cursor: busy ? "wait" : "pointer",
          fontFamily: "var(--font-body)",
          fontSize: 13,
          minHeight: 40,
        }}
      >
        <Building2 size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current?.name ?? "Workspace"}
        </span>
        <ChevronDown size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
      </button>

      {open && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            minWidth: 240,
            background: "var(--bg-surface)",
            border: "1px solid var(--bg-border)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.35))",
            padding: 6,
            zIndex: 60,
          }}
        >
          {workspaces.map((w) => (
            <button
              key={w.id}
              role="option"
              aria-selected={w.id === currentId}
              onClick={() => switchTo(w.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "9px 10px",
                borderRadius: "var(--radius-sm, 6px)",
                background: w.id === currentId ? "var(--bg-overlay)" : "transparent",
                border: "none",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                textAlign: "left",
                minHeight: 40,
              }}
            >
              <span style={{ minWidth: 0 }}>
                <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {w.name}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{roleLabels[w.role] ?? w.role}</span>
              </span>
              {w.id === currentId && <Check size={15} color="var(--brand-primary)" style={{ flexShrink: 0 }} />}
            </button>
          ))}

          <div style={{ height: 1, background: "var(--bg-border)", margin: "6px 4px" }} />

          <button
            onClick={createWorkspace}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "9px 10px",
              borderRadius: "var(--radius-sm, 6px)",
              background: "transparent",
              border: "none",
              color: "var(--brand-primary)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontSize: 13,
              minHeight: 40,
            }}
          >
            <Plus size={15} /> Workspace nou
          </button>
        </div>
      )}
    </div>
  );
}
