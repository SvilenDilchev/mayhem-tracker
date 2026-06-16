import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const VALUE_NAME = "MayhemTrackerAgent";

// Node's SEA binaries always carry the console subsystem, so launching the exe directly
// pops a console window. To start hidden on login, write a tiny VBScript next to the exe
// that launches it with no window, and point the Run key at that instead. The first
// double-click by the friend still shows a console once, which is fine.
export function registerAutostart(): void {
  try {
    const exePath = process.execPath;
    const launcherPath = path.join(path.dirname(exePath), "mayhem-agent-launch.vbs");
    const vbs = `CreateObject("WScript.Shell").Run """${exePath}""", 0, False`;
    fs.writeFileSync(launcherPath, vbs);

    execFileSync("reg", [
      "add",
      RUN_KEY,
      "/v",
      VALUE_NAME,
      "/t",
      "REG_SZ",
      "/d",
      `wscript.exe "${launcherPath}"`,
      "/f",
    ]);
  } catch (err) {
    console.log("Could not register autostart:", err);
  }
}
