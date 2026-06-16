import { authenticate, createHttp1Request, Credentials, HttpRequestOptions } from "league-connect";

let credentials: Credentials | null = null;

export async function connect(): Promise<Credentials> {
  credentials = await authenticate({ windowsShell: "powershell" });
  return credentials;
}

async function lcuRequest(url: string, method: HttpRequestOptions["method"] = "GET") {
  if (!credentials) {
    await connect();
  }
  const response = await createHttp1Request({ url, method }, credentials!);
  if (!response.ok) {
    throw new Error(`LCU request failed: ${response.status} ${url}`);
  }
  return response.json();
}

export async function fetchCurrentSummoner(): Promise<any> {
  return lcuRequest("/lol-summoner/v1/current-summoner");
}

export async function fetchMatchHistoryByPuuid(
  puuid: string,
  begIndex = 0,
  endIndex = 19,
): Promise<any> {
  return lcuRequest(
    `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=${begIndex}&endIndex=${endIndex}`,
  );
}

export async function fetchMatchHistory(begIndex = 0, endIndex = 19): Promise<any> {
  return lcuRequest(
    `/lol-match-history/v1/products/lol/current-summoner/matches?begIndex=${begIndex}&endIndex=${endIndex}`,
  );
}

export async function fetchGameDetails(gameId: number): Promise<any> {
  return lcuRequest(`/lol-match-history/v1/games/${gameId}`);
}
