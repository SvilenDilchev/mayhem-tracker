export interface GameRecord {
  game_id: number;
  queue_id: number;
  game_mode: string;
  game_creation: number;
  game_duration: number;
  puuid?: string;
  raw_json?: string;
}

export interface PlayerStatsRecord {
  game_id: number;
  champion_id: number;
  win: number;
  kills: number;
  deaths: number;
  assists: number;
  double_kills: number;
  triple_kills: number;
  quadra_kills: number;
  penta_kills: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  gold_earned: number;
  total_heal: number;
  largest_killing_spree: number;
  item0: number | null;
  item1: number | null;
  item2: number | null;
  item3: number | null;
  item4: number | null;
  item5: number | null;
  item6: number | null;
}

export interface GameAugment {
  game_id: number;
  slot: number;
  augment_id: number;
}

export interface MatchListItem {
  game_id: number;
  game_creation: number;
  game_duration: number;
  is_remake: number;
  puuid?: string;
  champion_id: number;
  win: number;
  kills: number;
  deaths: number;
  assists: number;
  double_kills: number;
  triple_kills: number;
  quadra_kills: number;
  penta_kills: number;
  total_damage_dealt: number;
  total_damage_taken: number;
  total_heal: number;
  gold_earned: number;
  item0: number | null;
  item1: number | null;
  item2: number | null;
  item3: number | null;
  item4: number | null;
  item5: number | null;
  augment_ids: string | null;
  game_max_dmg: number;
  game_max_taken: number;
  game_max_heal: number;
}

export interface MatchDetail {
  game: GameRecord;
  stats: PlayerStatsRecord;
  augments: GameAugment[];
  raw: any;
}

export interface ChampionStats {
  champion_id: number;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  avg_kills: number;
  avg_deaths: number;
  avg_assists: number;
  avg_damage: number;
  avg_gold: number;
  double_kills: number;
  triple_kills: number;
  quadra_kills: number;
  penta_kills: number;
}

export interface AugmentStats {
  augment_id: number;
  picks: number;
  wins: number;
}

export interface ItemStats {
  item_id: number;
  picks: number;
  wins: number;
}

export interface AugmentStatsDetailed {
  augment_id: number;
  picks: number;
  wins: number;
  champions: { champion_id: number; picks: number; wins: number }[];
}

export interface DashboardData {
  totalGames: number;
  wins: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  recentForm: { win: number; game_id: number }[];
  topChampions: ChampionStats[];
  multikills: {
    doubles: number;
    triples: number;
    quadras: number;
    pentas: number;
  };
  topAugments: AugmentStats[];
}

export interface ChampionData {
  [id: number]: {
    name: string;
    key: string;
  };
}

export interface AugmentData {
  [id: number]: {
    name: string;
    desc: string;
    iconPath: string;
    rarity: string;
  };
}

export interface TeammateStats {
  name: string;
  puuid: string | null;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  champions: { champion_id: number; games: number }[];
  lastPlayed: number;
}

export interface GlobalStats {
  champions: { champion_id: number; games: number; wins: number }[];
  augments: { augment_id: number; picks: number; wins: number }[];
  totalParticipantSlots: number;
}

export interface ParsedParticipant {
  participantId: number;
  championId: number;
  teamId: number;
  puuid: string | null;
  summonerName: string;
  kills: number;
  deaths: number;
  assists: number;
  doubleKills: number;
  tripleKills: number;
  quadraKills: number;
  pentaKills: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  goldEarned: number;
  totalHeal: number;
  largestKillingSpree: number;
  items: number[];
  augments: number[];
  win: boolean;
  isSelf: boolean;
}

export interface Summoner {
  puuid: string;
  game_name: string | null;
  tag_line: string | null;
}

export interface WebAPI {
  getMatchHistory: (
    limit: number,
    offset: number,
    puuid?: string,
  ) => Promise<{ matches: MatchListItem[]; total: number }>;
  getMatchDetail: (gameId: number) => Promise<MatchDetail>;
  getChampionStats: (puuid?: string) => Promise<ChampionStats[]>;
  getAugmentStats: (championId?: number, puuid?: string) => Promise<AugmentStats[]>;
  getAugmentStatsDetailed: (puuid?: string) => Promise<AugmentStatsDetailed[]>;
  getDashboard: (puuid?: string) => Promise<DashboardData>;
  getChampionMatchHistory: (
    championId: number,
    limit: number,
    offset: number,
    puuid?: string,
  ) => Promise<{ matches: MatchListItem[]; total: number }>;
  getChampionItemStats: (championId: number, puuid?: string) => Promise<ItemStats[]>;
  getTeammateStats: (puuid?: string) => Promise<TeammateStats[]>;
  getGlobalStats: (puuid?: string) => Promise<GlobalStats>;
  getSummonerPuuid: () => Promise<string | null>;
  getAllSummonerPuuids: () => Promise<string[]>;
  getSummoners: () => Promise<Summoner[]>;
  getChampionData: () => Promise<ChampionData>;
  getAugmentData: () => Promise<AugmentData>;
  onGamesUpdated: (callback: () => void) => () => void;
  getSetting: (key: string) => Promise<string | null>;
  setSetting: (key: string, value: string) => Promise<{ success: boolean }>;
  exportData: () => Promise<any>;
  importData: (data: unknown) => Promise<{ success: boolean; imported: number }>;
  repairPuuids: () => Promise<{ repairedGames: number; discoveredAccounts: number }>;
}

declare global {
  interface Window {
    api: WebAPI;
  }
}
