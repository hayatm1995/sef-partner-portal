import React, { useEffect, useState } from "react";
import { useDemo } from "./DemoContext";
import { DemoDeliverable, DemoDeliverableStatus } from "./demoData";
import { loadDemoDeliverables, saveDemoDeliverables } from "./demoDeliverablesStore";
import { Link } from "react-router-dom";

export default function DemoPartnerDeliverables() {
  const { role, partnerId } = useDemo();
  const [items, setItems] = useState<DemoDeliverable[]>([]);
  const [fileName, setFileName] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    setItems(loadDemoDeliverables());
  }, []);

  if (role !== "partner") {
    return <p>You are not in Partner mode. Go back and choose Partner.</p>;
  }
  if (!partnerId) {
    return <p>No partner selected. Go back to /demo and choose a partner.</p>;
  }

  const myItems = items.filter((d) => d.partnerId === partnerId);

  const updateItems = (next: DemoDeliverable[]) => {
    setItems(next);
    saveDemoDeliverables(next);
  };

  const handleCreateDraft = () => {
    if (!title) return;
    const now = new Date().toISOString();
    const newItem: DemoDeliverable = {
      id: "d_" + Math.random().toString(36).slice(2),
      partnerId,
      title,
      description: "",
      status: "draft",
      fileName: fileName || undefined,
      fileUrl: fileName ? "#" : undefined,
      updatedAt: now,
    };
    updateItems([...items, newItem]);
    setTitle("");
    setFileName("");
  };

  const changeStatus = (id: string, status: DemoDeliverableStatus) => {
    const next = items.map((d) =>
      d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d
    );
    updateItems(next);
  };

  return (
    <div>
      <h2>Deliverables (Demo – Partner View)</h2>
      <div style={{ marginBottom: 16 }}>
        <Link to="/demo/partner/hub" style={{ textDecoration: "underline" }}>
          ← Partner Hub
        </Link>
      </div>

      <div style={{ marginTop: 16, marginBottom: 24 }}>
        <h3>Create New Draft</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 400 }}>
          <input
            placeholder="Deliverable title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 8 }}
          />
          <input
            placeholder="File name (simulated)"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ padding: 8 }}
          />
          <button onClick={handleCreateDraft} style={{ padding: "6px 12px", alignSelf: "flex-start" }}>
            Save Draft
          </button>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Title</th>
            <th style={th}>Status</th>
            <th style={th}>File</th>
            <th style={th}>Updated</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {myItems.map((d) => (
            <tr key={d.id}>
              <td style={td}>{d.title}</td>
              <td style={td}>{d.status}</td>
              <td style={td}>{d.fileName || "-"}</td>
              <td style={td}>{new Date(d.updatedAt).toLocaleString()}</td>
              <td style={td}>
                {d.status === "draft" && (
                  <button onClick={() => changeStatus(d.id, "submitted")} style={{ padding: "4px 8px" }}>
                    Submit
                  </button>
                )}
                {d.status === "changes_requested" && (
                  <button onClick={() => changeStatus(d.id, "submitted")} style={{ padding: "4px 8px" }}>
                    Resubmit
                  </button>
                )}
              </td>
            </tr>
          ))}
          {myItems.length === 0 && (
            <tr>
              <td style={td} colSpan={5}>
                No deliverables yet.
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

