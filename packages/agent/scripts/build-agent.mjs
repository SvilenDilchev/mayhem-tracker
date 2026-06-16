import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";

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

if (!server || !token) {
  console.error(
    "Usage: npm run build-agent -- --server=https://your.domain --token=<token> --name=friend",
  );
  process.exit(1);
}

const root = path.join(__dirname, "..");
const distDir = path.join(root, "dist");
fs.mkdirSync(distDir, { recursive: true });

const bundlePath = path.join(distDir, "bundle.cjs");
const blobPath = path.join(distDir, "sea-prep.blob");
const seaConfigPath = path.join(distDir, "sea-config.json");
const outfile = path.join(distDir, `mayhem-agent-${name}.exe`);

console.log("Bundling...");
await esbuild.build({
  entryPoints: [path.join(root, "src", "index.ts")],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: bundlePath,
  minify: true,
  define: {
    __SERVER_URL__: JSON.stringify(server),
    __AGENT_TOKEN__: JSON.stringify(token),
  },
});

console.log("Generating SEA blob...");
fs.writeFileSync(
  seaConfigPath,
  JSON.stringify(
    {
      main: bundlePath,
      output: blobPath,
      disableExperimentalSEAWarning: true,
    },
    null,
    2,
  ),
);
execFileSync(process.execPath, ["--experimental-sea-config", seaConfigPath], { stdio: "inherit" });

console.log("Copying node binary...");
fs.copyFileSync(process.execPath, outfile);

console.log("Injecting blob...");
const postjectCli = fileURLToPath(import.meta.resolve("postject/dist/cli.js"));
execFileSync(
  process.execPath,
  [
    "--no-warnings",
    postjectCli,
    outfile,
    "NODE_SEA_BLOB",
    blobPath,
    "--sentinel-fuse",
    "NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2",
    "--overwrite",
  ],
  { stdio: "inherit" },
);

console.log(`Built ${outfile}`);
