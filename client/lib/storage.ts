import { createInitialDataset } from "@/data/seed";
import { DATASET_VERSION, type DemoDataset, type Session, type User } from "@/types";

const DATA_KEY = "workline.dataset";
const SESSION_KEY = "workline.session";

export function loadDataset(): DemoDataset {
  if (typeof window === "undefined") return createInitialDataset();
  try {
    const raw = window.localStorage.getItem(DATA_KEY);
    if (!raw) return createInitialDataset();
    const parsed = JSON.parse(raw) as DemoDataset & { users: Array<DemoDataset["users"][number] & { password?: unknown }> };
    if (parsed.version !== DATASET_VERSION) return createInitialDataset();
    return {
      ...parsed,
      users: parsed.users.map((user) => {
        const safeUser: User & { password?: unknown } = { ...user };
        delete safeUser.password;
        return safeUser;
      }),
    };
  } catch {
    return createInitialDataset();
  }
}

export function saveDataset(dataset: DemoDataset): void {
  window.localStorage.setItem(DATA_KEY, JSON.stringify(dataset));
}

export function resetDataset(): DemoDataset {
  const dataset = createInitialDataset();
  saveDataset(dataset);
  return dataset;
}

export function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (session.email === "manager@marku.demo") return null;
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null): void {
  if (!session) {
    window.localStorage.removeItem(SESSION_KEY);
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
