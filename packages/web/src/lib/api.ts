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
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null);
  if (entries.length === 0) return "";
  return "?" + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join("&");
}

export const api = {
  getMatchHistory: (limit: number, offset: number, puuid?: string) =>
    getJson(`/api/match-history${qs({ limit, offset, puuid })}`),

  getMatchDetail: (gameId: number) => getJson(`/api/match-detail/${gameId}`),

  getChampionStats: (puuid?: string) =>
    getJson(`/api/champion-stats${qs({ puuid })}`),

  getAugmentStats: (championId?: number, puuid?: string) =>
    getJson(`/api/augment-stats${qs({ championId, puuid })}`),

  getAugmentStatsDetailed: (puuid?: string) =>
    getJson(`/api/augment-stats-detailed${qs({ puuid })}`),

  getDashboard: (puuid?: string) =>
    getJson(`/api/dashboard${qs({ puuid })}`),

  getChampionMatchHistory: (championId: number, limit: number, offset: number, puuid?: string) =>
    getJson(`/api/champion-match-history/${championId}${qs({ limit, offset, puuid })}`),

  getChampionItemStats: (championId: number, puuid?: string) =>
    getJson(`/api/champion-item-stats/${championId}${qs({ puuid })}`),

  getTeammateStats: (puuid?: string) =>
    getJson(`/api/teammate-stats${qs({ puuid })}`),

  getGlobalStats: (puuid?: string) =>
    getJson(`/api/global-stats${qs({ puuid })}`),

  getSummonerPuuid: () => getJson("/api/summoner-puuid"),

  getAllSummonerPuuids: () => getJson("/api/all-summoner-puuids"),

  getSummoners: () => getJson("/api/summoners"),

  getChampionData: () => getJson("/api/champion-data"),

  getAugmentData: () => getJson("/api/augment-data"),

  onGamesUpdated: (_callback: () => void) => () => {},

  getSetting: (key: string) => getJson(`/api/settings/${key}`),

  setSetting: (key: string, value: string) => sendJson(`/api/settings/${key}`, "PUT", { value }),

  exportData: () => getJson("/api/export"),

  importData: (data: unknown) => sendJson("/api/import", "POST", data),

  repairPuuids: () => sendJson("/api/repair-puuids", "POST"),
};
