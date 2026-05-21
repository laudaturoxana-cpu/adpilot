"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="dashboard-content"
        style={{
          marginLeft: 240,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Navbar onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main
          style={{
            flex: 1,
            padding: "24px 20px",
            position: "relative",
            zIndex: 1,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
