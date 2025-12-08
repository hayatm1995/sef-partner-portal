import { DemoDeliverable, initialDemoDeliverables } from "./demoData";

const STORAGE_KEY = "sef_demo_deliverables_v1";

export function loadDemoDeliverables(): DemoDeliverable[] {
  if (typeof window === "undefined") return initialDemoDeliverables;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDemoDeliverables));
      return initialDemoDeliverables;
    }
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return initialDemoDeliverables;
  }
}

export function saveDemoDeliverables(items: DemoDeliverable[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

