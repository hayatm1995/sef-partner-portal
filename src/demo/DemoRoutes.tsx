import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DemoLayout from "./DemoLayout";
import DemoHome from "./DemoHome";
import DemoAdminDashboard from "./DemoAdminDashboard";
import DemoAdminPartners from "./DemoAdminPartners";
import DemoAdminDeliverables from "./DemoAdminDeliverables";
import DemoPartnerHub from "./DemoPartnerHub";
import DemoPartnerDeliverables from "./DemoPartnerDeliverables";

export default function DemoRoutes() {
  return (
    <DemoLayout>
      <Routes>
        <Route path="/" element={<DemoHome />} />
        <Route path="/admin/dashboard" element={<DemoAdminDashboard />} />
        <Route path="/admin/partners" element={<DemoAdminPartners />} />
        <Route path="/admin/deliverables" element={<DemoAdminDeliverables />} />
        <Route path="/partner/hub" element={<DemoPartnerHub />} />
        <Route path="/partner/deliverables" element={<DemoPartnerDeliverables />} />
        <Route path="*" element={<Navigate to="/demo" replace />} />
      </Routes>
    </DemoLayout>
  );
}

