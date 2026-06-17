import { SERVER_URL, AGENT_TOKEN, IS_COMPILED } from "./config.js";
import { connect, fetchCurrentSummoner, fetchMatchHistoryByPuuid, fetchMatchHistory, fetchGameDetails, subscribeToGameflow } from "./lcu.js";
import { hasSent, markSent, isAutostartRegistered, markAutostartRegistered } from "./state.js";
import { registerAutostart } from "./autostart.js";
import { initTray } from "./tray.js";
import fs from "fs";
import os from "os";
import path from "path";

const LEAGUE_CHECK_INTERVAL_MS = 60_000;
const LCU_READY_RETRY_MS = 5_000;
const TRACKED_QUEUES = new Set([450, 2400]); // normal ARAM + ARAM Mayhem
const POLL_TRIGGER_PHASES = new Set(["EndOfGame", "None"]);

const logFile = path.join(os.homedir(), ".mayhem-tracker-agent", "agent.log");
fs.mkdirSync(path.dirname(logFile), { recursive: true });

function log(...args: any[]): void {
  const line = `[${new Date().toISOString()}] ${args.map(String).join(" ")}\n`;
  process.stdout.write(line);
  fs.appendFileSync(logFile, line);
}

async function submitGames(puuid: string, summonerInfo: any, games: any[]): Promise<void> {
  if (games.length === 0) return;
  const res = await fetch(`${SERVER_URL}/api/agent/games`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AGENT_TOKEN}`,
    },
    body: JSON.stringify({ puuid, summonerInfo, games }),
  });
  if (!res.ok) {
    throw new Error(`Server rejected games: ${res.status} ${await res.text()}`);
  }
  for (const game of games) markSent(game.gameId);
}

async function pollOnce(): Promise<void> {
  const summoner = await fetchCurrentSummoner();
  log(`Polling for summoner puuid=${summoner.puuid} name=${summoner.displayName ?? summoner.gameName ?? "unknown"}`);

  let historyResponse: any;
  try {
    historyResponse = await fetchMatchHistoryByPuuid(summoner.puuid, 0, 19);
  } catch {
    historyResponse = await fetchMatchHistory(0, 19);
  }

  const games = historyResponse.games?.games || historyResponse.games || [];
  log(`Fetched ${games.length} games from LCU`);
  const newGames: any[] = [];

  for (const game of games) {
    if (!TRACKED_QUEUES.has(game.queueId)) continue;
    if (hasSent(game.gameId)) {
      log(`Skipping already-sent game ${game.gameId}`);
      continue;
    }

    let fullGame: any;
    try {
      fullGame = await fetchGameDetails(game.gameId);
    } catch {
      fullGame = game;
    }
    newGames.push(fullGame);
  }

  if (newGames.length > 0) {
    await submitGames(summoner.puuid, summoner, newGames);
    log(`Submitted ${newGames.length} new game(s)`);
  } else {
    log("No new games to submit");
  }
}

async function connectWithRetry(): Promise<void> {
  while (true) {
    try {
      await connect();
      return;
    } catch {
      await sleep(LEAGUE_CHECK_INTERVAL_MS);
    }
  }
}

async function main() {
  log(`Mayhem Tracker agent starting, server=${SERVER_URL}`);

  initTray();

  if (IS_COMPILED && !isAutostartRegistered()) {
    registerAutostart();
    markAutostartRegistered();
  }

  while (true) {
    await connectWithRetry();
    log("Connected to League Client");

    // LCU HTTP may not be ready immediately after authenticate() — retry for up to 60s
    let ready = false;
    for (let i = 0; i < 12; i++) {
      try {
        await pollOnce();
        ready = true;
        break;
      } catch (err) {
        log(`Poll error on connect (attempt ${i + 1}/12), retrying in 5s:`, err);
        await sleep(LCU_READY_RETRY_MS);
      }
    }
    if (!ready) {
      log("LCU never became ready, reconnecting...");
      continue;
    }

    try {
      await subscribeToGameflow(async (phase) => {
        if (!POLL_TRIGGER_PHASES.has(phase)) return;
        log(`Gameflow phase: ${phase} — polling`);
        try {
          await pollOnce();
        } catch (err) {
          log("Poll error after gameflow event:", err);
        }
      });
      // subscribeToGameflow resolves once the WS closes — reconnect
      log("WebSocket closed, reconnecting...");
    } catch (err) {
      log("WebSocket error, reconnecting:", err);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
