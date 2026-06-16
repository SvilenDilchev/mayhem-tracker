import { SERVER_URL, AGENT_TOKEN, IS_COMPILED } from "./config.js";
import { connect, fetchCurrentSummoner, fetchMatchHistoryByPuuid, fetchMatchHistory, fetchGameDetails } from "./lcu.js";
import { hasSent, markSent, isAutostartRegistered, markAutostartRegistered } from "./state.js";
import { registerAutostart } from "./autostart.js";
import { initTray } from "./tray.js";

const POLL_INTERVAL_MS = 60_000;
const CONNECT_RETRY_MS = 5_000;
const TRACKED_QUEUES = new Set([450, 2400]); // normal ARAM + ARAM Mayhem

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

  let historyResponse: any;
  try {
    historyResponse = await fetchMatchHistoryByPuuid(summoner.puuid, 0, 19);
  } catch {
    historyResponse = await fetchMatchHistory(0, 19);
  }

  const games = historyResponse.games?.games || historyResponse.games || [];
  const newGames: any[] = [];

  for (const game of games) {
    if (!TRACKED_QUEUES.has(game.queueId)) continue;
    if (hasSent(game.gameId)) continue;

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
    console.log(`Submitted ${newGames.length} new game(s)`);
  }
}

async function main() {
  console.log(`Mayhem Tracker agent starting, server=${SERVER_URL}`);

  initTray();

  if (IS_COMPILED && !isAutostartRegistered()) {
    registerAutostart();
    markAutostartRegistered();
  }

  while (true) {
    try {
      await connect();
      break;
    } catch {
      await sleep(CONNECT_RETRY_MS);
    }
  }
  console.log("Connected to League Client");

  while (true) {
    try {
      await pollOnce();
    } catch (err) {
      console.log("Poll error, will retry:", err);
      // Lost connection — wait for the client to come back.
      while (true) {
        try {
          await connect();
          break;
        } catch {
          await sleep(CONNECT_RETRY_MS);
        }
      }
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main();
