// __SERVER_URL__ / __AGENT_TOKEN__ are inlined as string literals at build time by
// scripts/build-agent.mjs (esbuild --define). When running via `npm run dev` they're
// untouched identifiers, so we fall back to env vars for local testing.
declare const __SERVER_URL__: string | undefined;
declare const __AGENT_TOKEN__: string | undefined;

export const SERVER_URL = (
  (typeof __SERVER_URL__ !== "undefined" ? __SERVER_URL__ : undefined) ??
  process.env.MAYHEM_SERVER_URL ??
  "http://127.0.0.1:3001"
).replace(/\/+$/, "");

export const AGENT_TOKEN =
  (typeof __AGENT_TOKEN__ !== "undefined" ? __AGENT_TOKEN__ : undefined) ??
  process.env.MAYHEM_AGENT_TOKEN ??
  "";

// True only in a binary built by build-agent.mjs (config baked in at compile time),
// false when running from source via `npm run dev`.
export const IS_COMPILED = typeof __SERVER_URL__ !== "undefined";

if (!AGENT_TOKEN) {
  console.error("No agent token configured (set MAYHEM_AGENT_TOKEN or build with build-agent.mjs).");
  process.exit(1);
}
