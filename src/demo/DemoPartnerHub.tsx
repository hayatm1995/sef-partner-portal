import React from "react";
import { useDemo } from "./DemoContext";
import { demoPartners } from "./demoData";
import { Link } from "react-router-dom";

export default function DemoPartnerHub() {
  const { role, partnerId } = useDemo();

  if (role !== "partner") {
    return <p>You are not in Partner mode. Go back and choose Partner.</p>;
  }
  if (!partnerId) {
    return <p>No partner selected. Go back to /demo and choose a partner.</p>;
  }

  const partner = demoPartners.find((p) => p.id === partnerId);
  if (!partner) {
    return <p>Selected partner not found in demo data.</p>;
  }

  return (
    <div>
      <h2>{partner.name} – Partner Hub (Demo)</h2>
      <p>Tier: {partner.tier}</p>
      <p>Contact: {partner.contactPerson}</p>
      <div style={{ marginTop: 24 }}>
        <Link to="/demo/partner/deliverables" style={{ textDecoration: "underline" }}>
          Go to Deliverables
        </Link>
      </div>
    </div>
  );
}

