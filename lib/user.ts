import type { StoredScoreEntry, StoredUser } from "./types";

const USER_KEY = "av_user";
const SCORES_KEY = "av_scores";

const listeners = new Set<() => void>();
let cachedUser: StoredUser | null | undefined;

function readStoredUser(): StoredUser | null {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function subscribeStoredUser(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStoredUserSnapshot(): StoredUser | null {
  if (cachedUser === undefined) cachedUser = readStoredUser();
  return cachedUser;
}

export function getServerStoredUserSnapshot(): StoredUser | null {
  return null;
}

export function setStoredUser(user: StoredUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
  cachedUser = user;
  listeners.forEach((listener) => listener());
}

export function clearStoredUser(): void {
  setStoredUser(null);
}

export function saveScore(entry: Omit<StoredScoreEntry, "at">): void {
  try {
    const all: StoredScoreEntry[] = JSON.parse(localStorage.getItem(SCORES_KEY) || "[]");
    all.push({ ...entry, at: Date.now() });
    localStorage.setItem(SCORES_KEY, JSON.stringify(all));
  } catch {}
}
