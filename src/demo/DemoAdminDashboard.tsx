import React from "react";
import { useDemo } from "./DemoContext";
import { demoPartners } from "./demoData";
import { loadDemoDeliverables } from "./demoDeliverablesStore";
import { Link } from "react-router-dom";

export default function DemoAdminDashboard() {
  const { role } = useDemo();
  const deliverables = loadDemoDeliverables();

  const totalPartners = demoPartners.length;
  const totalDeliverables = deliverables.length;
  const submitted = deliverables.filter((d) => d.status === "submitted").length;
  const approved = deliverables.filter((d) => d.status === "approved").length;

  if (role !== "admin" && role !== "superadmin") {
    return <p>You are not in Admin mode. Go back and choose Admin or Superadmin.</p>;
  }

  return (
    <div>
      <h2>Admin Dashboard (Demo)</h2>
      <p>Quick overview of demo data.</p>
      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <Stat label="Partners" value={totalPartners} />
        <Stat label="Deliverables" value={totalDeliverables} />
        <Stat label="Submitted" value={submitted} />
        <Stat label="Approved" value={approved} />
      </div>
      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link to="/demo/admin/partners" style={{ textDecoration: "underline" }}>
          View Partners
        </Link>
        <Link to="/demo/admin/deliverables" style={{ textDecoration: "underline" }}>
          Review Deliverables
        </Link>
      </div>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: number }) => (
  <div
    style={{
      padding: 16,
      borderRadius: 12,
      border: "1px solid #374151",
      minWidth: 160,
      background: "#111827",
    }}
  >
    <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 600 }}>{value}</div>
  </div>
);

