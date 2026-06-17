import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";
import pngToIco from "png-to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function getArg(name) {
  const prefix = `--${name}=`;
  const found = args.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

const server = getArg("server");
const token = getArg("token");
const name = getArg("name") ?? "agent";
const targetPlatform = getArg("platform") ?? process.platform; // "win32" or "darwin"

if (!server || !token) {
  console.error(
    "Usage: npm run build-agent -- --server=https://your.domain --token=<token> --name=friend [--platform=win32|darwin]",
  );
  process.exit(1);
}

const isWindows = targetPlatform === "win32";
const isMac = targetPlatform === "darwin";

const root = path.join(__dirname, "..");
const repoRoot = path.join(root, "..", "..");
const distDir = path.join(root, "dist");
fs.mkdirSync(distDir, { recursive: true });

// Embed the appropriate systray2 tray helper binary
const trayBinName = isWindows ? "tray_windows_release.exe" : "tray_darwin_release";
const trayBinPath = path.join(repoRoot, "node_modules", "systray2", "traybin", trayBinName);
const trayBinB64 = fs.readFileSync(trayBinPath).toString("base64");

// Icon: Windows tray requires ICO, Mac uses PNG
const iconPngPath = path.join(repoRoot, "assets", "icon.png");
let iconB64;
if (isWindows) {
  const iconIcoBuffer = await pngToIco(iconPngPath);
  iconB64 = iconIcoBuffer.toString("base64");
} else {
  iconB64 = fs.readFileSync(iconPngPath).toString("base64");
}

const exeSuffix = isWindows ? ".exe" : "";
const bundlePath = path.join(distDir, "bundle.cjs");
const blobPath = path.join(distDir, "sea-prep.blob");
const seaConfigPath = path.join(distDir, "sea-config.json");
const outfile = path.join(distDir, `mayhem-agent-${name}${exeSuffix}`);

// esbuild plugin: patch league-connect to hide the PowerShell window it spawns
// when finding the League Client lockfile (adds windowsHide: true to exec options).
const hideShellPlugin = {
  name: "hide-powershell",
  setup(build) {
    build.onLoad({ filter: /league-connect.*index\.(c?js)$/ }, async (args) => {
      let contents = await fs.promises.readFile(args.path, "utf8");
      contents = contents.replace(
        `{ shell: (options == null ? void 0 : options.windowsShell) ?? "powershell" }`,
        `{ shell: (options == null ? void 0 : options.windowsShell) ?? "powershell", windowsHide: true }`,
      );
      return { contents, loader: "js" };
    });
  },
};

console.log(`Bundling for ${targetPlatform}...`);
await esbuild.build({
  entryPoints: [path.join(root, "src", "index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: bundlePath,
  minify: true,
  plugins: [hideShellPlugin],
  define: {
    __SERVER_URL__: JSON.stringify(server),
    __AGENT_TOKEN__: JSON.stringify(token),
    __TRAY_BIN_B64__: JSON.stringify(trayBinB64),
    __ICON_B64__: JSON.stringify(iconB64),
  },
});

console.log("Generating SEA blob...");
fs.writeFileSync(
  seaConfigPath,
  JSON.stringify({ main: bundlePath, output: blobPath, disableExperimentalSEAWarning: true }, null, 2),
);
execFileSync(process.execPath, ["--experimental-sea-config", seaConfigPath], { stdio: "inherit" });

console.log("Copying node binary...");
fs.copyFileSync(process.execPath, outfile);

console.log("Injecting blob...");
const postjectCli = fileURLToPath(import.meta.resolve("postject/dist/cli.js"));
const postjectArgs = [
  "--no-warnings", postjectCli, outfile, "NODE_SEA_BLOB", blobPath,
  "--sentinel-fuse", "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2", "--overwrite",
];
if (isMac) {
  postjectArgs.push("--macho-segment-name", "NODE_SEA");
}
execFileSync(process.execPath, postjectArgs, { stdio: "inherit" });

if (isWindows) {
  // Patch PE subsystem: CUI (3) → GUI (2) so the exe never opens a console window.
  // Both PE32 and PE32+ have Subsystem at optional_header_start + 0x44,
  // where optional_header_start = PE_sig_offset + 0x18.
  console.log("Patching PE subsystem CUI → GUI...");
  const exeBuf = fs.readFileSync(outfile);
  const peOffset = exeBuf.readUInt32LE(0x3C);
  const subsystemOffset = peOffset + 0x5C;
  exeBuf.writeUInt16LE(2, subsystemOffset);
  fs.writeFileSync(outfile, exeBuf);
} else if (isMac) {
  // Ad-hoc sign so Gatekeeper doesn't block it as "damaged"
  try {
    execFileSync("codesign", ["--sign", "-", "--force", outfile], { stdio: "inherit" });
    console.log("Ad-hoc signed.");
  } catch {
    console.log("codesign not available, skipping signing.");
  }
}

console.log(`Built ${outfile}`);
