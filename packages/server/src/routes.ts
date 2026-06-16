import { Router } from "express";
import * as db from "@mayhem-tracker/shared";
import * as dragon from "@mayhem-tracker/shared";
import { requireAgentToken } from "./auth.js";

export const router = Router();

function puuidParam(req: any): string | undefined {
  return req.query.puuid ? String(req.query.puuid) : undefined;
}

// ---- Read endpoints ----

router.get("/match-history", (req, res) => {
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = parseInt(String(req.query.offset ?? "0"));
  res.json(db.getMatchHistory(limit, offset, puuidParam(req)));
});

router.get("/match-detail/:gameId", (req, res) => {
  const gameId = parseInt(req.params.gameId);
  const detail = db.getMatchDetail(gameId);
  if (!detail) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(detail);
});

router.get("/champion-stats", (req, res) => {
  res.json(db.getChampionStatsAll(puuidParam(req)));
});

router.get("/augment-stats", (req, res) => {
  const championId = req.query.championId ? parseInt(String(req.query.championId)) : undefined;
  res.json(db.getAugmentStatsAll(championId, puuidParam(req)));
});

router.get("/augment-stats-detailed", (req, res) => {
  res.json(db.getAugmentStatsWithChampions(puuidParam(req)));
});

router.get("/dashboard", (req, res) => {
  res.json(db.getDashboardData(puuidParam(req)));
});

router.get("/champion-match-history/:championId", (req, res) => {
  const championId = parseInt(req.params.championId);
  const limit = parseInt(String(req.query.limit ?? "20"));
  const offset = parseInt(String(req.query.offset ?? "0"));
  res.json(db.getChampionMatchHistory(championId, limit, offset, puuidParam(req)));
});

router.get("/champion-item-stats/:championId", (req, res) => {
  const championId = parseInt(req.params.championId);
  res.json(db.getChampionItemStats(championId, puuidParam(req)));
});

router.get("/teammate-stats", (req, res) => {
  res.json(db.getTeammateStats(puuidParam(req)));
});

router.get("/global-stats", (req, res) => {
  res.json(db.getGlobalStats(puuidParam(req)));
});

router.get("/all-summoner-puuids", (_req, res) => {
  res.json(db.getAllPuuids());
});

router.get("/summoners", (_req, res) => {
  res.json(db.getAllSummoners());
});

router.get("/summoner-puuid", (_req, res) => {
  const s = db.getSummoner();
  res.json(s?.puuid ?? null);
});

// ---- Static game data ----

router.get("/champion-data", async (_req, res) => {
  await dragon.waitForChampionData();
  res.json(dragon.getChampionData());
});

router.get("/augment-data", async (_req, res) => {
  await dragon.waitForAugmentData();
  res.json(dragon.getAugmentDataCache());
});

// ---- Settings ----

router.get("/settings/:key", (req, res) => {
  res.json(db.getSetting(req.params.key));
});

router.put("/settings/:key", (req, res) => {
  db.setSetting(req.params.key, String(req.body?.value ?? ""));
  res.json({ success: true });
});

// ---- Backup / repair ----

router.get("/export", (_req, res) => {
  res.json(db.exportAllData());
});

router.post("/import", (req, res) => {
  const imported = db.importData(req.body);
  res.json({ success: true, imported });
});

router.post("/repair-puuids", (_req, res) => {
  res.json(db.repairPuuids());
});

// ---- Agent ingestion ----

router.post("/agent/games", requireAgentToken, (req, res) => {
  const { puuid, summonerInfo, games } = req.body ?? {};
  if (!puuid || !Array.isArray(games)) {
    res.status(400).json({ error: "Expected { puuid, summonerInfo?, games: [] }" });
    return;
  }

  if (summonerInfo) {
    db.upsertSummoner({ puuid, ...summonerInfo });
  }

  let inserted = 0;
  for (const game of games) {
    if (db.insertGameFull(game, puuid)) inserted++;
  }

  res.json({ success: true, received: games.length, inserted });
});
