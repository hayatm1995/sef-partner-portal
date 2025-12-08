import React from "react";
import { useDemo } from "./DemoContext";
import { demoPartners } from "./demoData";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

export default function DemoAdminPartners() {
  const { role, setRole, setPartnerId } = useDemo();
  const navigate = useNavigate();

  if (role !== "admin" && role !== "superadmin") {
    return <p>You are not in Admin mode. Go back and choose Admin or Superadmin.</p>;
  }

  const handleViewAsPartner = (partnerId: string) => {
    setRole("partner");
    setPartnerId(partnerId);
    navigate("/demo/partner/hub");
  };

  return (
    <div>
      <h2>Partners (Demo)</h2>
      <div style={{ marginBottom: 16 }}>
        <Link to="/demo/admin/dashboard" style={{ textDecoration: "underline", marginRight: 16 }}>
          ← Dashboard
        </Link>
        <Link to="/demo/admin/deliverables" style={{ textDecoration: "underline" }}>
          Deliverables →
        </Link>
      </div>
      <table style={{ width: "100%", marginTop: 16, borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={th}>Name</th>
            <th style={th}>Tier</th>
            <th style={th}>Contact</th>
            <th style={th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {demoPartners.map((p) => (
            <tr key={p.id}>
              <td style={td}>{p.name}</td>
              <td style={td}>{p.tier}</td>
              <td style={td}>{p.contactPerson}</td>
              <td style={td}>
                <button onClick={() => handleViewAsPartner(p.id)} style={{ padding: "4px 10px" }}>
                  View as Partner
                </button>
              </td>
            </tr>
          ))}
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

