import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { initDatabase, loadChampionData, loadAugmentData } from "@mayhem-tracker/shared";
import { router } from "./routes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

initDatabase();
loadChampionData();
loadAugmentData();

const app = express();
app.use(express.json({ limit: "5mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", router);

const webDist = process.env.WEB_DIST ?? path.join(__dirname, "..", "..", "web", "dist");
app.use(express.static(webDist));
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(webDist, "index.html"));
});

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
app.listen(port, "127.0.0.1", () => {
  console.log(`Mayhem Tracker server listening on http://127.0.0.1:${port}`);
});
