import React, { useEffect, useState } from "react";
import { useDemo } from "./DemoContext";
import { DemoDeliverable, DemoDeliverableStatus, demoPartners } from "./demoData";
import { loadDemoDeliverables, saveDemoDeliverables } from "./demoDeliverablesStore";
import { Link } from "react-router-dom";

export default function DemoAdminDeliverables() {
  const { role } = useDemo();
  const [items, setItems] = useState<DemoDeliverable[]>([]);

  useEffect(() => {
    setItems(loadDemoDeliverables());
  }, []);

  if (role !== "admin" && role !== "superadmin") {
    return <p>You are not in Admin mode. Go back and choose Admin or Superadmin.</p>;
  }

  const updateItems = (next: DemoDeliverable[]) => {
    setItems(next);
    saveDemoDeliverables(next);
  };

  const changeStatus = (id: string, status: DemoDeliverableStatus) => {
    const next = items.map((d) =>
      d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
    );
    updateItems(next);
  };

  const getPartnerName = (partnerId: string) =>
    demoPartners.find((p) => p.id === partnerId)?.name || partnerId;

  return (
    <div>
      <h2>Deliverables (Demo – Admin View)</h2>
      <div style={{ marginBottom: 16 }}>
        <Link to="/demo/admin/dashboard" style={{ textDecoration: "underline", marginRight: 16 }}>
          ← Dashboard
        </Link>
        <Link to="/demo/admin/partners" style={{ textDecoration: "underline" }}>
          Partners →
        </Link>
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <thead>
          <tr>
            <th style={th}>Partner</th>
            <th style={th}>Title</th>
            <th style={th}>Status</th>
            <th style={th}>File</th>
            <th style={th}>Updated</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((d) => (
            <tr key={d.id}>
              <td style={td}>{getPartnerName(d.partnerId)}</td>
              <td style={td}>{d.title}</td>
              <td style={td}>{d.status}</td>
              <td style={td}>{d.fileName || "-"}</td>
              <td style={td}>{new Date(d.updatedAt).toLocaleString()}</td>
              <td style={td}>
                <button onClick={() => changeStatus(d.id, "approved")} style={{ marginRight: 8 }}>
                  Approve
                </button>
                <button onClick={() => changeStatus(d.id, "changes_requested")}>
                  Request Changes
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td style={td} colSpan={6}>
                No deliverables found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 6px",
  borderBottom: "1px solid #374151",
  fontSize: 12,
  textTransform: "uppercase",
  opacity: 0.7,
};
const td: React.CSSProperties = {
  padding: "8px 6px",
  borderBottom: "1px solid #111827",
  fontSize: 14,
};

