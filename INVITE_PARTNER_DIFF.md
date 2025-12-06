# Invite Partner Feature - Changes Diff

## 1. NEW FILE: src/services/emailService.ts
- Complete email service with Resend SDK
- Belong+ branded HTML template
- Magic link sending functionality

## 2. RENAME & FIX: src/pages/admin/InvitePartner.jsx → InvitePartner.tsx
- Rename file extension from .jsx to .tsx
- Remove TypeScript type annotation from mutationFn parameter:
  - BEFORE: `mutationFn: async (data: { name: string; email: string }) => {`
  - AFTER: `mutationFn: async (data) => {`

## 3. MODIFY: src/pages/index.jsx
- Add import: `import InvitePartner from "./admin/InvitePartner";`
- Add route: `<Route path="invite-partner" element={<InvitePartner />} />`

## 4. MODIFY: src/pages/Layout.jsx
- Add icon import: `UserPlus` to lucide-react imports
- Add menu item: `{ title: "Invite Partner", url: "/admin/invite-partner", icon: UserPlus },`

## 5. MODIFY: package.json
- Add dependency: `"resend": "^3.0.0"`

