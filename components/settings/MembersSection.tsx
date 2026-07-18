"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";

interface MemberRow {
  id: string;
  role: string;
  user_id: string;
  profiles?: { email?: string; full_name?: string } | null;
}

const roleLabels: Record<string, string> = {
  owner: "Owner", admin: "Admin", media_buyer: "Media Buyer", strategist: "Strategist",
  creative: "Creative", approver: "Approver", client: "Client", viewer: "Viewer",
};

export function MembersSection({ workspaceId }: { workspaceId: string }) {
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}/members`);
        if (res.ok && active) {
          const { data } = await res.json();
          setMembers(data ?? []);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [workspaceId]);

  if (loading) return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Se încarcă...</p>;
  if (members.length === 0) return <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Niciun membru.</p>;

  return (
    <div>
      {members.map((m) => (
        <div
          key={m.id}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
            padding: "12px 16px", background: "var(--bg-elevated)",
            border: "1px solid var(--bg-border)", borderRadius: "var(--radius-md)", marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: "var(--brand-primary-glow)",
              border: "1px solid var(--brand-primary)", display: "flex", alignItems: "center",
              justifyContent: "center", flexShrink: 0,
            }}>
              <User size={14} color="var(--brand-primary)" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.profiles?.full_name || m.profiles?.email || "Membru"}
              </p>
              {m.profiles?.email && (
                <p style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.profiles.email}
                </p>
              )}
            </div>
          </div>
          <span style={{
            fontSize: 12, fontWeight: 500, color: "var(--brand-primary)",
            padding: "4px 10px", borderRadius: 999, background: "var(--brand-primary-glow)",
            border: "1px solid var(--brand-primary)", flexShrink: 0,
          }}>
            {roleLabels[m.role] ?? m.role}
          </span>
        </div>
      ))}
    </div>
  );
}
