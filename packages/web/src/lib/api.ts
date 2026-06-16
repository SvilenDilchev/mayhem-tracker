async function getJson(path: string): Promise<any> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function sendJson(path: string, method: string, body?: unknown): Promise<any> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

function qs(params: Record<string, unknown>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined);
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const api = {
  getMatchHistory: (limit: number, offset: number) =>
    getJson(`/api/match-history${qs({ limit, offset })}`),

  getMatchDetail: (gameId: number) => getJson(`/api/match-detail/${gameId}`),

  getChampionStats: () => getJson("/api/champion-stats"),

  getAugmentStats: (championId?: number) => getJson(`/api/augment-stats${qs({ championId })}`),

  getAugmentStatsDetailed: () => getJson("/api/augment-stats-detailed"),

  getDashboard: () => getJson("/api/dashboard"),

  getChampionMatchHistory: (championId: number, limit: number, offset: number) =>
    getJson(`/api/champion-match-history/${championId}${qs({ limit, offset })}`),

  getChampionItemStats: (championId: number) => getJson(`/api/champion-item-stats/${championId}`),

  getTeammateStats: () => getJson("/api/teammate-stats"),

  getGlobalStats: () => getJson("/api/global-stats"),

  getSummonerPuuid: () => getJson("/api/summoner-puuid"),

  getAllSummonerPuuids: () => getJson("/api/all-summoner-puuids"),

  getChampionData: () => getJson("/api/champion-data"),

  getAugmentData: () => getJson("/api/augment-data"),

  onGamesUpdated: (_callback: () => void) => () => {},

  getSetting: (key: string) => getJson(`/api/settings/${key}`),

  setSetting: (key: string, value: string) => sendJson(`/api/settings/${key}`, "PUT", { value }),

  exportData: () => getJson("/api/export"),

  importData: (data: unknown) => sendJson("/api/import", "POST", data),

  repairPuuids: () => sendJson("/api/repair-puuids", "POST"),
};
