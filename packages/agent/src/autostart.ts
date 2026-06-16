import { execFileSync } from "child_process";

const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const VALUE_NAME = "MayhemTrackerAgent";

export function registerAutostart(): void {
  try {
    execFileSync("reg", [
      "add", RUN_KEY,
      "/v", VALUE_NAME,
      "/t", "REG_SZ",
      "/d", `"${process.execPath}"`,
      "/f",
    ]);
  } catch (err) {
    console.log("Could not register autostart:", err);
  }
}
