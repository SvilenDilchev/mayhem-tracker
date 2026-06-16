import fs from "fs";
import os from "os";
import path from "path";

const stateDir = path.join(os.homedir(), ".mayhem-tracker-agent");
const stateFile = path.join(stateDir, "state.json");

interface State {
  sentGameIds: number[];
  autostartRegistered?: boolean;
}

function load(): State {
  try {
    return JSON.parse(fs.readFileSync(stateFile, "utf-8"));
  } catch {
    return { sentGameIds: [] };
  }
}

let state = load();
let sentSet = new Set(state.sentGameIds);

export function hasSent(gameId: number): boolean {
  return sentSet.has(gameId);
}

export function markSent(gameId: number): void {
  if (sentSet.has(gameId)) return;
  sentSet.add(gameId);
  state.sentGameIds.push(gameId);
  // Cap how much history we keep locally — the server is the source of truth for dedup anyway.
  if (state.sentGameIds.length > 500) {
    state.sentGameIds = state.sentGameIds.slice(-500);
    sentSet = new Set(state.sentGameIds);
  }
  save();
}

export function isAutostartRegistered(): boolean {
  return !!state.autostartRegistered;
}

export function markAutostartRegistered(): void {
  state.autostartRegistered = true;
  save();
}

function save(): void {
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state));
}
