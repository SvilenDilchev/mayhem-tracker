import { useRef, useState, useCallback } from "react";

export default function Settings() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [repairStatus, setRepairStatus] = useState<string | null>(null);

  const handleExport = useCallback(async () => {
    setExportStatus(null);
    try {
      const data = await window.api.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mayhem-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportStatus("Downloaded backup file");
    } catch (err: any) {
      setExportStatus(`Error: ${err.message}`);
    }
  }, []);

  const handleImportFile = useCallback(async (file: File) => {
    setImportStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await window.api.importData(data);
      setImportStatus(`Imported ${result.imported} new game(s)`);
    } catch (err: any) {
      setImportStatus(`Error: ${err.message}`);
    }
  }, []);

  const handleRepair = useCallback(async () => {
    setRepairStatus(null);
    try {
      const result = await window.api.repairPuuids();
      setRepairStatus(
        `Repaired ${result.repairedGames} game(s), found ${result.discoveredAccounts} account(s)`,
      );
    } catch (err: any) {
      setRepairStatus(`Error: ${err.message}`);
    }
  }, []);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-bold text-lol-text-bright">Settings</h1>

      {/* Data Management */}
      <div className="bg-lol-card rounded-xl border border-lol-border p-5">
        <h2 className="text-sm font-semibold text-lol-text-bright mb-4">Data Management</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lol-text-bright">Export data</p>
              <p className="text-xs text-lol-text mt-0.5">
                Download all match data as a JSON file for backup
              </p>
            </div>
            <button
              onClick={handleExport}
              className="px-4 py-1.5 rounded text-sm bg-lol-gold/20 text-lol-gold hover:bg-lol-gold/30 transition-colors"
            >
              Export
            </button>
          </div>
          {exportStatus && <p className="text-xs text-lol-text">{exportStatus}</p>}

          <div className="border-t border-lol-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lol-text-bright">Import data</p>
              <p className="text-xs text-lol-text mt-0.5">
                Load match data from a previously exported file
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = "";
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-1.5 rounded text-sm bg-lol-gold/20 text-lol-gold hover:bg-lol-gold/30 transition-colors"
            >
              Import
            </button>
          </div>
          {importStatus && <p className="text-xs text-lol-text">{importStatus}</p>}

          <div className="border-t border-lol-border" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-lol-text-bright">Repair account data</p>
              <p className="text-xs text-lol-text mt-0.5">
                Re-detect which accounts are tracked by analyzing game history. Use this if games
                are attributed to the wrong account.
              </p>
            </div>
            <button
              onClick={handleRepair}
              className="px-4 py-1.5 rounded text-sm bg-lol-gold/20 text-lol-gold hover:bg-lol-gold/30 transition-colors"
            >
              Repair
            </button>
          </div>
          {repairStatus && <p className="text-xs text-lol-text">{repairStatus}</p>}
        </div>
      </div>
    </div>
  );
}
