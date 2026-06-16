import crypto from "crypto";
import { initDatabase, createAgentToken } from "@mayhem-tracker/shared";

const label = process.argv[2];
if (!label) {
  console.error("Usage: npm run create-agent -- <label>");
  process.exit(1);
}

initDatabase();

const token = crypto.randomBytes(32).toString("hex");
createAgentToken(token, label);

console.log(`Created agent token for "${label}":`);
console.log(token);
