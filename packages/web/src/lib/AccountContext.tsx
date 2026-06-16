import { createContext, useContext, useEffect, useState } from "react";
import type { Summoner } from "./types";

interface AccountContextValue {
  summoners: Summoner[];
  selectedPuuid: string | null;
  setSelectedPuuid: (puuid: string) => void;
}

const AccountContext = createContext<AccountContextValue>({
  summoners: [],
  selectedPuuid: null,
  setSelectedPuuid: () => {},
});

export function AccountProvider({ children }: { children: React.ReactNode }) {
  const [summoners, setSummoners] = useState<Summoner[]>([]);
  const [selectedPuuid, setSelectedPuuid] = useState<string | null>(null);

  useEffect(() => {
    window.api.getSummoners().then((s) => {
      setSummoners(s);
      if (s.length > 0 && !selectedPuuid) {
        setSelectedPuuid(s[0].puuid);
      }
    });
  }, []);

  return (
    <AccountContext.Provider value={{ summoners, selectedPuuid, setSelectedPuuid }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  return useContext(AccountContext);
}

export function summonerLabel(s: Summoner): string {
  if (s.game_name && s.tag_line) return `${s.game_name}#${s.tag_line}`;
  if (s.game_name) return s.game_name;
  return s.puuid.slice(0, 8);
}
