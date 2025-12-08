export type DemoPartner = {
  id: string;
  name: string;
  tier: "Gold" | "Silver" | "Bronze";
  contactPerson: string;
};

export type DemoDeliverableStatus = "draft" | "submitted" | "approved" | "changes_requested";

export type DemoDeliverable = {
  id: string;
  partnerId: string;
  title: string;
  description?: string;
  status: DemoDeliverableStatus;
  adminComment?: string;
  fileName?: string;
  fileUrl?: string;
  updatedAt: string;
};

export const demoPartners: DemoPartner[] = [
  { id: "p1", name: "Sharjah Bank", tier: "Gold", contactPerson: "Sara Ali" },
  { id: "p2", name: "Tech Oasis", tier: "Silver", contactPerson: "Omar Khan" },
  { id: "p3", name: "Future Foods", tier: "Bronze", contactPerson: "Lina Ahmed" },
];

// initial seed – will be copied into localStorage on first run
export const initialDemoDeliverables: DemoDeliverable[] = [
  {
    id: "d1",
    partnerId: "p1",
    title: "Logo pack",
    description: "High-res logo files",
    status: "approved",
    adminComment: "Looks good.",
    fileName: "logo-pack.zip",
    fileUrl: "#",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "d2",
    partnerId: "p2",
    title: "Booth design",
    description: "Final booth layout",
    status: "changes_requested",
    adminComment: "Please adjust the branding on the left wall.",
    fileName: "booth-v2.pdf",
    fileUrl: "#",
    updatedAt: new Date().toISOString(),
  },
];

