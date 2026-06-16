import { spawn } from "child_process";
import { createInterface } from "readline";
import fs from "fs";
import os from "os";
import path from "path";

declare const __TRAY_BIN_B64__: string | undefined;
declare const __ICON_B64__: string | undefined;

const TRAY_BIN_B64 = typeof __TRAY_BIN_B64__ !== "undefined" ? __TRAY_BIN_B64__ : "";
const ICON_B64 = typeof __ICON_B64__ !== "undefined" ? __ICON_B64__ : "";

const QUIT_ID = 1;

function extractTrayHelper(): string {
  const dir = path.join(os.homedir(), ".mayhem-tracker-agent");
  const binPath = path.join(dir, "tray-helper.exe");
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(binPath)) {
    fs.writeFileSync(binPath, Buffer.from(TRAY_BIN_B64, "base64"), { mode: 0o755 });
  }
  return binPath;
}

export function initTray(): void {
  if (!TRAY_BIN_B64) return; // dev mode — no embedded binary

  const binPath = extractTrayHelper();

  const proc = spawn(binPath, [], {
    windowsHide: true,
    stdio: ["pipe", "pipe", "inherit"],
  });

  const rl = createInterface({ input: proc.stdout! });

  const menu = {
    icon: ICON_B64,
    title: "",
    tooltip: "Mayhem Tracker Agent",
    items: [{ title: "Quit", tooltip: "", checked: false, enabled: true, hidden: false, __id: QUIT_ID }],
  };

  rl.on("line", (line) => {
    try {
      const event = JSON.parse(line);
      if (event.type === "ready") {
        proc.stdin!.write(JSON.stringify(menu) + "\n");
      } else if (event.type === "clicked" && event.__id === QUIT_ID) {
        proc.kill();
        process.exit(0);
      }
    } catch {
      /* ignore malformed lines */
    }
  });
}
