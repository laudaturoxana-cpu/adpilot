import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ marginLeft: 240, flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Navbar />
        <main
          style={{
            flex: 1,
            padding: "28px 32px",
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
