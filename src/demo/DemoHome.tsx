import React from "react";
import { useDemo } from "./DemoContext";
import { demoPartners } from "./demoData";
import { useNavigate } from "react-router-dom";

export default function DemoHome() {
  const { role, partnerId, setRole, setPartnerId } = useDemo();
  const navigate = useNavigate();

  const handleContinue = () => {
    if (role === "partner" && !partnerId) return;
    if (role === "superadmin" || role === "admin") {
      navigate("/demo/admin/dashboard");
    } else if (role === "partner") {
      navigate("/demo/partner/hub");
    }
  };

  return (
    <div>
      <h2>Choose a Role</h2>
      <p>Select how you want to experience the SEF Partner Hub.</p>

      <div style={{ display: "flex", gap: 16, marginTop: 16, flexWrap: "wrap" }}>
        <button onClick={() => setRole("superadmin")} style={buttonStyle(role === "superadmin")}>
          Superadmin
        </button>
        <button onClick={() => setRole("admin")} style={buttonStyle(role === "admin")}>
          Admin
        </button>
        <button onClick={() => setRole("partner")} style={buttonStyle(role === "partner")}>
          Partner
        </button>
      </div>

      {role === "partner" && (
        <div style={{ marginTop: 24 }}>
          <h3>Select Partner</h3>
          <select
            value={partnerId || ""}
            onChange={(e) => setPartnerId(e.target.value || null)}
            style={{ padding: 8, minWidth: 240 }}
          >
            <option value="">-- choose partner --</option>
            {demoPartners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.tier})
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ marginTop: 32 }}>
        <button
          onClick={handleContinue}
          disabled={role === "none" || (role === "partner" && !partnerId)}
          style={{
            padding: "10px 20px",
            borderRadius: 999,
            border: "none",
            cursor: role === "none" || (role === "partner" && !partnerId) ? "not-allowed" : "pointer",
            opacity: role === "none" || (role === "partner" && !partnerId) ? 0.5 : 1,
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}

const buttonStyle = (active: boolean): React.CSSProperties => ({
  padding: "12px 16px",
  borderRadius: 12,
  border: active ? "2px solid #facc15" : "1px solid #444",
  background: active ? "#1d2433" : "#111827",
  cursor: "pointer",
});

