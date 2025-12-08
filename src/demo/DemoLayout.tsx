import React from "react";
import { DemoProvider } from "./DemoContext";

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <div style={{ minHeight: "100vh", background: "#050816", color: "white" }}>
        <header style={{ padding: "16px 24px", borderBottom: "1px solid #222" }}>
          <h1 style={{ margin: 0 }}>SEF Partner Hub – Demo Mode</h1>
          <p style={{ margin: "4px 0 0", opacity: 0.8 }}>
            No login, no RLS – safe sandbox to test flows.
          </p>
        </header>
        <main style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>{children}</main>
      </div>
    </DemoProvider>
  );
}

