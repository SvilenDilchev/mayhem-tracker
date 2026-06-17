import { execFileSync, execSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const WIN_RUN_KEY = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run";
const WIN_VALUE_NAME = "MayhemTrackerAgent";

function registerWindows(): void {
  execFileSync("reg", [
    "add", WIN_RUN_KEY,
    "/v", WIN_VALUE_NAME,
    "/t", "REG_SZ",
    "/d", `"${process.execPath}"`,
    "/f",
  ]);
}

function registerMac(): void {
  const plistDir = path.join(os.homedir(), "Library", "LaunchAgents");
  const plistPath = path.join(plistDir, "dev.mayhem-tracker.agent.plist");
  fs.mkdirSync(plistDir, { recursive: true });
  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>dev.mayhem-tracker.agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>${process.execPath}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>`;
  fs.writeFileSync(plistPath, plist);
  execSync(`launchctl load "${plistPath}"`);
}

export function registerAutostart(): void {
  try {
    if (process.platform === "win32") {
      registerWindows();
    } else if (process.platform === "darwin") {
      registerMac();
    }
  } catch (err) {
    console.log("Could not register autostart:", err);
  }
}
